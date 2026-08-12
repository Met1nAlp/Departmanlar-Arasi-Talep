import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants/theme';

// GEÇİCİ mock rapor verisi — Faz 6'da gerçek agregasyonla değişecek
const departmentStats = [
  { name: 'Depo', requestCount: 42 },
  { name: 'Bakım', requestCount: 17 },
  { name: 'Elektrik', requestCount: 9 },
];
const maxCount = Math.max(...departmentStats.map((d) => d.requestCount));

export default function DepartmentReportsScreen() {
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