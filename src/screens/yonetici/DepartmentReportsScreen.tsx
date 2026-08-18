// src/screens/yonetici/DepartmentReportsScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { getDepartmentStats } from '../../api/stats';

export default function DepartmentReportsScreen() {
  const [departmentStats, setDepartmentStats] = useState<{ name: string; requestCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartmentStats().then((data) => {
      setDepartmentStats(data);
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

  const maxCount = Math.max(...departmentStats.map((d) => d.requestCount));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      {departmentStats.map((d) => (
        <View key={d.name} style={{ marginBottom: spacing.md }}>
          <View style={styles.labelRow}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{d.name}</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{d.requestCount}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(d.requestCount / maxCount) * 100}%` }]} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  barTrack: { height: 10, backgroundColor: colors.surface, borderRadius: radius.sm, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.blue },
});