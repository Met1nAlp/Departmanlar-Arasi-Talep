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
      <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RejectRequest" component={RejectRequestScreen} options={{ title: 'Talebi Reddet' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MaterialRequestQueue" component={MaterialRequestQueueScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PartialFulfillment" component={PartialFulfillmentScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ContainerSelect"
        component={ContainerSelectScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="SerialCapture"
        component={SerialCaptureScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}