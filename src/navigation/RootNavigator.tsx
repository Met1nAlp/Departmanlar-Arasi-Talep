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
  const { user, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // GEÇİCİ: gerçek token kontrolü yok, o yüzden direkt kapatıyoruz.
    // Faz 2'de burada AsyncStorage'dan token okuyup varsa login() çağıracağız.
    setLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'saha_personeli' && <SahaPersoneliNavigator />}
      {user?.role === 'departman_yetkilisi' && <DepartmanYetkilisiNavigator />}
      {user?.role === 'yonetici' && <YoneticiNavigator />}
    </NavigationContainer>
  );
}