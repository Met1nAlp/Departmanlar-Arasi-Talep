import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { SahaPersoneliStackParamList } from './types';

import HomeScreen from '../screens/saha-personeli/HomeScreen';
import DepartmentSelectScreen from '../screens/saha-personeli/DepartmentSelectScreen';
import QRScanScreen from '../screens/saha-personeli/QRScanScreen';
import RequestCreatedScreen from '../screens/saha-personeli/RequestCreatedScreen';
import RequestTrackingScreen from '../screens/saha-personeli/RequestTrackingScreen';
import DeliveryConfirmScreen from '../screens/saha-personeli/DeliveryConfirmScreen';
import CancelRequestScreen from '../screens/saha-personeli/CancelRequestScreen';
import ProductSearchScreen from '../screens/saha-personeli/ProductSearchScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import PartSearchForCartScreen from '../screens/saha-personeli/PartSearchForCartScreen';
import CartQuantityScreen from '../screens/saha-personeli/CartQuantityScreen';
import MaterialRequestCartScreen from '../screens/saha-personeli/MaterialRequestCartScreen';


const Stack = createNativeStackNavigator<SahaPersoneliStackParamList>();

export default function SahaPersoneliNavigator() {
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
      <Stack.Screen name="QRScan" component={QRScanScreen} options={{ title: 'QR Kod Okut' }} />
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
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductSearch" component={ProductSearchScreen} options={{ title: 'Ürün Ara' }} />
      <Stack.Screen name="PartSearchForCart" component={PartSearchForCartScreen} options={{ title: 'Parça Ara' }} />
      <Stack.Screen name="CartQuantity" component={CartQuantityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MaterialRequestCart" component={MaterialRequestCartScreen} options={{ title: 'Çoklu Talep' }} />
    </Stack.Navigator>
  );
}