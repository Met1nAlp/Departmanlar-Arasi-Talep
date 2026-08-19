import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { colors } from '../constants/theme';
import ConnectionBanner from '../components/ConnectionBanner';
import { connectRealtime, disconnectRealtime } from '../infrastructure/realtime/instance';
import { outboxWorker, refreshPendingSyncBadge } from '../infrastructure/sync/instance';
import { syncCatalog } from '../infrastructure/sync/CatalogSync';
import { database } from '../infrastructure/db';

import AuthNavigator from './AuthNavigator';
import SahaPersoneliNavigator from './SahaPersoneliNavigator';
import DepartmanYetkilisiNavigator from './DepartmanYetkilisiNavigator';
import YoneticiNavigator from './YoneticiNavigator';

export default function RootNavigator() {
  const activeSession = useAuthStore((s) => s.activeSession);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isDeviceLoading = useDeviceStore((s) => s.isLoading);
  const hydrateDevice = useDeviceStore((s) => s.hydrate);
  const isLoading = isAuthLoading || isDeviceLoading;

  useEffect(() => {
    // Plan Bölüm 14.2: açılışta SecureStore'daki token'lar okunur; refresh
    // token hâlâ geçerliyse yetkili oturumu geri yüklenir (personel PIN
    // oturumu kalıcı tutulmaz — bkz. authStore.hydrate yorumu).
    hydrate();
    // Cihaz kaydı, yetkili oturumundan bağımsız olarak her açılışta okunur
    // (bkz. store/deviceStore.ts — kalıcı, oturum kapanışında silinmez).
    hydrateDevice();
  }, [hydrate, hydrateDevice]);

  useEffect(() => {
    // Plan Bölüm 9: gerçek zaman bağlantısı yalnızca bir personel PIN oturumu
    // açıkken anlamlı (kanal aboneliği o kişinin bölümüne göre kurulur).
    // Backend WS ucu henüz yoksa connectRealtime no-op'tur (bkz.
    // config/realtimeConfig.ts), yani bu efekt bugün sessizce hiçbir şey
    // yapmaz — bağlantı hazır olduğunda tek satır bile değişmeyecek.
    if (activeSession) {
      connectRealtime(activeSession.user);
    } else {
      disconnectRealtime();
    }
    return () => disconnectRealtime();
  }, [activeSession]);

  useEffect(() => {
    // Plan §12.4 kural 5: "Uygulama açılışında outbox otomatik işlenir."
    void outboxWorker.processQueue().then(refreshPendingSyncBadge);
    // Plan §10.3: katalog cihazda tam olarak önbelleklenir, delta senkron ile güncellenir.
    void syncCatalog(database);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const user = activeSession?.user ?? null;

  return (
    <View style={{ flex: 1 }}>
      <ConnectionBanner />
      <NavigationContainer>
        {!user && <AuthNavigator />}
        {user?.role === 'saha_personeli' && <SahaPersoneliNavigator />}
        {user?.role === 'departman_yetkilisi' && <DepartmanYetkilisiNavigator />}
        {user?.role === 'yonetici' && <YoneticiNavigator />}
      </NavigationContainer>
    </View>
  );
}
