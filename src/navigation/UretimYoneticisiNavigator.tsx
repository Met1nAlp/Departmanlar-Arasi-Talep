import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { UretimYoneticisiStackParamList } from './types';

import HomeScreen from '../screens/uretim-yoneticisi/HomeScreen';
import DepartmentSelectScreen from '../screens/uretim-yoneticisi/DepartmentSelectScreen';
import QRScanScreen from '../screens/uretim-yoneticisi/QRScanScreen';
import RequestCreatedScreen from '../screens/uretim-yoneticisi/RequestCreatedScreen';
import RequestTrackingScreen from '../screens/uretim-yoneticisi/RequestTrackingScreen';
import DeliveryConfirmScreen from '../screens/uretim-yoneticisi/DeliveryConfirmScreen';
import CancelRequestScreen from '../screens/uretim-yoneticisi/CancelRequestScreen';
import ProductSearchScreen from '../screens/uretim-yoneticisi/ProductSearchScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator<UretimYoneticisiStackParamList>();

export default function UretimYoneticisiNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue },
        headerTintColor: colors.white,
        headerTitleStyle: typography.h2,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DepartmentSelect" component={DepartmentSelectScreen} options={{ headerShown: false }} />
      <Stack.Screen name="QRScan" component={QRScanScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="RequestCreated"
        component={RequestCreatedScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="RequestTracking" component={RequestTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DeliveryConfirm"
        component={DeliveryConfirmScreen}
        options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="CancelRequest" component={CancelRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductSearch" component={ProductSearchScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
