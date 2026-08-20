import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import DeviceEnrollScreen from '../screens/auth/DeviceEnrollScreen';
import CardLoginScreen from '../screens/auth/CardLoginScreen';
import { useIsDeviceEnrolled } from '../store/deviceStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * NFC oturum modeli: sıralama basitleşti — önce cihaz kaydı (BT/kurulum
 * tarafından bir kez yapılır, MAC ile), sonra kart okutma. Ayrı bir yetkili
 * girişi / PIN katmanı yok. Cihaz kayıtlı değilse kart okutma ekranı bile
 * açılmaz — kayıtsız cihaz sunucuya hiç bağlanamayacağı için CARD_LOGIN de
 * anlamsız olurdu.
 */
export default function AuthNavigator() {
  const isDeviceEnrolled = useIsDeviceEnrolled();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isDeviceEnrolled ? (
        <Stack.Screen name="DeviceEnroll" component={DeviceEnrollScreen} />
      ) : (
        <Stack.Screen name="CardLogin" component={CardLoginScreen} />
      )}
    </Stack.Navigator>
  );
}