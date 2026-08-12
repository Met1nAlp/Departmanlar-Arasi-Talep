import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants/theme';

// GEÇİCİ mock istatistikler
const stats = [
  { label: 'Bugünkü Talepler', value: '24' },
  { label: 'Ortalama Hazırlama Süresi', value: '18 dk' },
  { label: 'Ortalama Teslimat Süresi', value: '9 dk' },
  { label: 'En Çok Talep Edilen Ürün', value: 'Vida Seti M6' },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});