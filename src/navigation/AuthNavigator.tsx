import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import DeviceEnrollScreen from '../screens/auth/DeviceEnrollScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import PinSessionScreen from '../screens/auth/PinSessionScreen';
import { useAuthStore } from '../store/authStore';
import { useIsDeviceEnrolled } from '../store/deviceStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Plan Bölüm 14.2: sıralama önemli — önce cihaz kaydı (adım 1, BT/kurulum
 * tarafından bir kez yapılır), sonra yetkili girişi (adım 2), sonra personel
 * PIN oturumu (adım 3). Cihaz kayıtlı değilse yetkili girişi bile açılmaz.
 * Bu navigator yalnızca RootNavigator'ın "activeSession yok" dalında render edilir.
 */
export default function AuthNavigator() {
  const supervisor = useAuthStore((s) => s.supervisor);
  const isDeviceEnrolled = useIsDeviceEnrolled();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isDeviceEnrolled ? (
        <Stack.Screen name="DeviceEnroll" component={DeviceEnrollScreen} />
      ) : !supervisor ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="PinSession" component={PinSessionScreen} />
      )}
    </Stack.Navigator>
  );
}
