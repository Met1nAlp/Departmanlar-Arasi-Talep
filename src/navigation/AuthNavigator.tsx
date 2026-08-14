import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import PinSessionScreen from '../screens/auth/PinSessionScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Plan Bölüm 14.2: supervisor girişi yapılmadıysa Login, yapıldıysa (ama
 * henüz personel PIN oturumu açmadıysa) PinSession gösterilir. Bu navigator
 * yalnızca RootNavigator'ın "activeSession yok" dalında render edilir.
 */
export default function AuthNavigator() {
  const supervisor = useAuthStore((s) => s.supervisor);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!supervisor ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="PinSession" component={PinSessionScreen} />
      )}
    </Stack.Navigator>
  );
}
