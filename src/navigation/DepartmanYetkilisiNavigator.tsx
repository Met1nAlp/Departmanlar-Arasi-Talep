import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { DepartmanYetkilisiStackParamList } from './types';

import IncomingRequestsScreen from '../screens/departman-yetkilisi/IncomingRequestsScreen';
import RequestDetailScreen from '../screens/departman-yetkilisi/RequestDetailScreen';
import RejectRequestScreen from '../screens/departman-yetkilisi/RejectRequestScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import MaterialRequestQueueScreen from '../screens/departman-yetkilisi/MaterialRequestQueueScreen';
import PartialFulfillmentScreen from '../screens/departman-yetkilisi/PartialFulfillmentScreen';
import ContainerSelectScreen from '../screens/departman-yetkilisi/ContainerSelectScreen';
import SerialCaptureScreen from '../screens/departman-yetkilisi/SerialCaptureScreen';

const Stack = createNativeStackNavigator<DepartmanYetkilisiStackParamList>();

export default function DepartmanYetkilisiNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue },
        headerTintColor: colors.white,
        headerTitleStyle: typography.h2,
      }}
    >
      <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} options={{ title: 'Gelen Talepler' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Talep Detayı' }} />
      <Stack.Screen name="RejectRequest" component={RejectRequestScreen} options={{ title: 'Talebi Reddet' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="MaterialRequestQueue" component={MaterialRequestQueueScreen} options={{ title: 'Çok Kalemli Talepler' }} />
      <Stack.Screen name="PartialFulfillment" component={PartialFulfillmentScreen} options={{ title: 'Karşılama' }} />
      <Stack.Screen name="ContainerSelect" component={ContainerSelectScreen} options={{ title: 'Kap Seç', presentation: 'modal' }} />
      <Stack.Screen name="SerialCapture" component={SerialCaptureScreen} options={{ title: 'Seri No Gir', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}