// src/screens/yonetici/DashboardScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '../../design-system/components/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { getDashboardStats } from '../../api/stats';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<Nav>();

useEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <Ionicons
        name="settings-outline"
        size={24}
        color={colors.white}
        style={{ marginRight: spacing.md }}
        onPress={() => navigation.navigate('Settings')}
      />
    ),
  });
}, [navigation]);

useEffect(() => {
  getDashboardStats().then((data) => {
    setStats(data);
    setLoading(false);
  });
}, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="Eskalasyon Listesi"
        onPress={() => navigation.navigate('EscalationList')}
        variant="secondary"
        style={{ marginBottom: spacing.md }}
      />
      {stats.map((s) => (
        <View key={s.label} style={styles.card}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{s.label}</Text>
          <Text style={[typography.h1, { color: colors.blue, marginTop: spacing.xs }]}>{s.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
});