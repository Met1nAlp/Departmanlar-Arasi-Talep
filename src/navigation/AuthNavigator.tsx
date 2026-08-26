import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthStackParamList } from './types';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import CardLoginScreen from '../screens/auth/CardLoginScreen';
import DeviceUnauthorizedScreen from '../screens/auth/DeviceUnauthorizedScreen';
import { colors } from '../constants/theme';
import { useConnectionStore } from '../store/connectionStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Cihaz yetkilendirmesi tamamen otomatik — kullanıcıdan kod/form istemez.
 * RootNavigator zaten uygulama açılışında connectMepsanServer()'ı tetikliyor;
 * bu navigator sadece o sürecin sonucuna (deviceAuthStatus) göre yönlendirir.
 * Cihaz yetkiliyse akış Welcome -> CardLogin şeklinde ilerler.
 */
export default function AuthNavigator() {
  const deviceAuthStatus = useConnectionStore((s) => s.deviceAuthStatus);

  if (deviceAuthStatus === 'idle' || deviceAuthStatus === 'authorizing') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {deviceAuthStatus === 'unauthorized' ? (
        <Stack.Screen name="DeviceUnauthorized" component={DeviceUnauthorizedScreen} />
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CardLogin" component={CardLoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}