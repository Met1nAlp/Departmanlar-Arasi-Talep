import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/theme';
import { DepartmanYetkilisiStackParamList } from './types';

import IncomingRequestsScreen from '../screens/departman-yetkilisi/IncomingRequestsScreen';
import RequestDetailScreen from '../screens/departman-yetkilisi/RequestDetailScreen';

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
    </Stack.Navigator>
  );
}