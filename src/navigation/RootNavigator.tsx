import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator , Text} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { colors } from '../constants/theme';
import { connectRealtime, disconnectRealtime } from '../infrastructure/realtime/instance';
import { connectMepsanServer, disconnectMepsanServer } from '../infrastructure/mepsanServer/instance';
import { outboxWorker, refreshPendingSyncBadge } from '../infrastructure/sync/instance';
import { syncCatalog } from '../infrastructure/sync/CatalogSync';
import { database } from '../infrastructure/db';

import AuthNavigator from './AuthNavigator';
import SahaPersoneliNavigator from './SahaPersoneliNavigator';
import DepartmanYetkilisiNavigator from './DepartmanYetkilisiNavigator';
import YoneticiNavigator from './YoneticiNavigator';
import { initNotificationService, checkAndNotifyMissedUpdates } from '../infrastructure/notifications/notificationService';
import { navigationRef } from './navigationRef';

export default function RootNavigator() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isDeviceLoading = useDeviceStore((s) => s.isLoading);
  const hydrateDevice = useDeviceStore((s) => s.hydrate);

  useEffect(() => {
    // NFC modelinde authStore'un artık bir hydrate()'i yok (SecureStore'dan
    // geri yükleme mantığı kaldırıldı — bkz. authStore.ts dosya başı notu).
    // Cihaz kaydı hâlâ kalıcı, o yüzden sadece hydrateDevice çağrılıyor.
    hydrateDevice();
  }, [hydrateDevice]);

  useEffect(() => {
    connectMepsanServer();
    return () => {
      disconnectMepsanServer();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      connectRealtime(currentUser);
    } else {
      disconnectRealtime();
    }
    return () => {
      disconnectRealtime();
    };
  }, [currentUser]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    void outboxWorker.processQueue().then(refreshPendingSyncBadge);
    void syncCatalog(database);
  }, []);

  useEffect(() => {
    const cleanup = initNotificationService();
    return cleanup;
  }, []);

  // Uygulama her açıldığında (currentUser hazır olunca), kapalıyken kaçırılan
  // durum değişikliklerini kontrol et ve bildirim göster.
  useEffect(() => {
    if (!currentUser) return;
    void checkAndNotifyMissedUpdates(database);
  }, [currentUser]);

  if (isDeviceLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        {!currentUser && <AuthNavigator />}
        {currentUser?.role === 'saha_personeli' && <SahaPersoneliNavigator />}
        {currentUser?.role === 'departman_yetkilisi' && <DepartmanYetkilisiNavigator />}
        {currentUser?.role === 'yonetici' && <YoneticiNavigator />}
        {currentUser && !['saha_personeli','departman_yetkilisi','yonetici'].includes(currentUser.role) && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
            <Text>Tanınmayan rol: {currentUser.role}</Text>
          </View>
)}
      </NavigationContainer>
    </View>
  );
}