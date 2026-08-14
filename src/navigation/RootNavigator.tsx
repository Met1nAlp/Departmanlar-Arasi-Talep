import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

import AuthNavigator from './AuthNavigator';
import SahaPersoneliNavigator from './SahaPersoneliNavigator';
import DepartmanYetkilisiNavigator from './DepartmanYetkilisiNavigator';
import YoneticiNavigator from './YoneticiNavigator';

export default function RootNavigator() {
  const activeSession = useAuthStore((s) => s.activeSession);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Plan Bölüm 14.2: açılışta SecureStore'daki token'lar okunur; refresh
    // token hâlâ geçerliyse yetkili oturumu geri yüklenir (personel PIN
    // oturumu kalıcı tutulmaz — bkz. authStore.hydrate yorumu).
    hydrate();
  }, [hydrate]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const user = activeSession?.user ?? null;

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'saha_personeli' && <SahaPersoneliNavigator />}
      {user?.role === 'departman_yetkilisi' && <DepartmanYetkilisiNavigator />}
      {user?.role === 'yonetici' && <YoneticiNavigator />}
    </NavigationContainer>
  );
}
