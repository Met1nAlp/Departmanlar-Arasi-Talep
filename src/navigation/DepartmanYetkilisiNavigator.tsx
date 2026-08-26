import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { DepartmanYetkilisiStackParamList } from './types';

import IncomingRequestsScreen from '../screens/departman-yetkilisi/IncomingRequestsScreen';
import RequestDetailScreen from '../screens/departman-yetkilisi/RequestDetailScreen';
import RejectRequestScreen from '../screens/departman-yetkilisi/RejectRequestScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

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
      <Stack.Screen name="RejectRequest" component={RejectRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}