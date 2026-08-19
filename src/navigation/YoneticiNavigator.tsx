import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/theme';
import { YoneticiStackParamList } from './types';

import DashboardScreen from '../screens/yonetici/DashboardScreen';
import AllRequestsScreen from '../screens/yonetici/AllRequestsScreen';
import DepartmentReportsScreen from '../screens/yonetici/DepartmentReportsScreen';
import EscalationListScreen from '../screens/yonetici/EscalationListScreen';
import SettingsScreen from '../screens/yonetici/SettingsScreen';

const Tab = createBottomTabNavigator<YoneticiStackParamList>();

export default function YoneticiNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Özet', tabBarLabel: '📊 Özet' }} />
      <Tab.Screen name="AllRequests" component={AllRequestsScreen} options={{ title: 'Tüm Talepler', tabBarLabel: '📋 Talepler' }} />
      <Tab.Screen name="EscalationList" component={EscalationListScreen} options={{ title: 'Eskalasyon', tabBarLabel: '⚠️ Eskalasyon' }} />
      <Tab.Screen name="DepartmentReports" component={DepartmentReportsScreen} options={{ title: 'Raporlar', tabBarLabel: '📈 Raporlar' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar', tabBarLabel: '⚙️ Ayarlar' }} />
    </Tab.Navigator>
  );
}