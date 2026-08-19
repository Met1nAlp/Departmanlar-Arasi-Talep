// src/design-system/components/PriorityBadge.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';

// Efe'nin domain katmanındaki Priority enum'una bağlanacak (E1 maddesi).
// Şimdilik string union olarak tanımlıyoruz, tip hazır olunca oradan import edeceğiz.
export type Priority = 'LINE_DOWN' | 'URGENT' | 'NORMAL' | 'PLANNED';

// Plan §16.2: HAT DURDU = tehlike (kırmızı), ACİL = işlemde/uyarı (amber),
// NORMAL = bekliyor (mavi), PLANLI = nötr (gri). Mockup'taki dolgulu pill
// stiline uyarlandı (bkz. "Yeni öncelik seçin" ekranı).
const priorityConfig: Record<Priority, { color: string; bgColor: string; label: string }> = {
  LINE_DOWN: { color: colors.stateDanger, bgColor: colors.stateDangerBg, label: 'HAT DURDU' },
  URGENT: { color: colors.stateActive, bgColor: colors.stateActiveBg, label: 'Acil' },
  NORMAL: { color: colors.statePending, bgColor: colors.blueLight, label: 'Normal' },
  PLANNED: { color: colors.stateNeutral, bgColor: colors.stateNeutralBg, label: 'Planlı' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text variant="caption" color="textPrimary" style={{ fontWeight: '700', color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
});