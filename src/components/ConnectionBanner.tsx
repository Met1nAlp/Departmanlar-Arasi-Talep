// src/components/ConnectionBanner.tsx
//
// Plan Bölüm 9.2: "Bağlantı durumu her zaman görünür ... Kullanıcı asla
// belirsizlikte kalmaz." Plan Bölüm 7.4: bekleyen senkronizasyon sayısı da
// aynı şeritte gösterilir ("Senkronize edilecek: 3"). Backend WS ucu henüz
// yokken de bu bant DISCONNECTED durumunu dürüstçe gösterir — gizlenmez.
import { View, Text, StyleSheet } from 'react-native';
import { useConnectionStore } from '../store/connectionStore';
import { getConnectionStatusPresentation } from '../infrastructure/realtime/connectionStatusPresentation';
import { colors, spacing, typography } from '../constants/theme';

export default function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  const pendingSyncCount = useConnectionStore((s) => s.pendingSyncCount);
  const { label, dotColor } = getConnectionStatusPresentation(status);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      {pendingSyncCount > 0 && (
        <Text style={[typography.caption, { color: colors.textMuted, marginLeft: spacing.sm }]}>
          Senkronize edilecek: {pendingSyncCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
});
