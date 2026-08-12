import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { SahaPersoneliStackParamList } from './types';

import HomeScreen from '../screens/saha-personeli/HomeScreen';
import DepartmentSelectScreen from '../screens/saha-personeli/DepartmentSelectScreen';
import QRScanScreen from '../screens/saha-personeli/QRScanScreen';
import RequestCreatedScreen from '../screens/saha-personeli/RequestCreatedScreen';
import RequestTrackingScreen from '../screens/saha-personeli/RequestTrackingScreen';
import DeliveryConfirmScreen from '../screens/saha-personeli/DeliveryConfirmScreen';

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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Taleplerim' }} />
      <Stack.Screen name="DepartmentSelect" component={DepartmentSelectScreen} options={{ title: 'Departman Seç' }} />
      <Stack.Screen name="QRScan" component={QRScanScreen} options={{ title: 'QR Kod Okut' }} />
      <Stack.Screen name="RequestCreated" component={RequestCreatedScreen} options={{ title: 'Talep Oluşturuldu' }} />
      <Stack.Screen name="RequestTracking" component={RequestTrackingScreen} options={{ title: 'Talep Takibi' }} />
      <Stack.Screen name="DeliveryConfirm" component={DeliveryConfirmScreen} options={{ title: 'Teslim Onayı' }} />
    </Stack.Navigator>
  );
}