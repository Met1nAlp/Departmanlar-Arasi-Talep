import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
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
    void outboxWorker.processQueue().then(refreshPendingSyncBadge);
    void syncCatalog(database);
  }, []);

  if (isDeviceLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {!currentUser && <AuthNavigator />}
        {currentUser?.role === 'saha_personeli' && <SahaPersoneliNavigator />}
        {currentUser?.role === 'departman_yetkilisi' && <DepartmanYetkilisiNavigator />}
        {currentUser?.role === 'yonetici' && <YoneticiNavigator />}
      </NavigationContainer>
    </View>
  );
}