// src/navigation/YoneticiNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';

import DashboardScreen from '../screens/yonetici/DashboardScreen';
import AllRequestsScreen from '../screens/yonetici/AllRequestsScreen';
import DepartmentReportsScreen from '../screens/yonetici/DepartmentReportsScreen';
import AuditTimelineScreen from '../screens/yonetici/AuditTimelineScreen';
import EscalationListScreen from '../screens/yonetici/EscalationListScreen';
import ChangePriorityScreen from '../screens/yonetici/ChangePriorityScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';


const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Alt sekmeler — eskiden olduğu gibi
function YoneticiTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Özet' }} />
      <Tab.Screen name="AllRequests" component={AllRequestsScreen} options={{ title: 'Tüm Talepler' }} />
      <Tab.Screen name="DepartmentReports" component={DepartmentReportsScreen} options={{ title: 'Raporlar' }} />
    </Tab.Navigator>
  );
}

// YENİ: Sekmelerin üstüne bir Stack koyduk ki AuditTimeline modal gibi açılabilsin.
// Sekmeler artık "YoneticiTabs" adında tek bir ekran gibi Stack'in içinde duruyor.
export default function YoneticiNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="YoneticiTabs" component={YoneticiTabs} />
      <RootStack.Screen
        name="AuditTimeline"
        component={AuditTimelineScreen}
        options={{ headerShown: true, title: 'Denetim Zaman Çizelgesi', presentation: 'modal' }}
      />
      <RootStack.Screen
  name="EscalationList"
  component={EscalationListScreen}
  options={{ headerShown: true, title: 'Eskalasyon Listesi', presentation: 'modal' }}
/>
<RootStack.Screen
  name="ChangePriority"
  component={ChangePriorityScreen}
  options={{ headerShown: true, title: 'Öncelik Değiştir', presentation: 'modal' }}
/>
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Ayarlar', presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}