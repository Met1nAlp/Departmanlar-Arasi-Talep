// src/design-system/components/PriorityBadge.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';

// Efe'nin domain katmanındaki Priority enum'una bağlanacak (E1 maddesi).
// Şimdilik string union olarak tanımlıyoruz, tip hazır olunca oradan import edeceğiz.
export type Priority = 'LINE_DOWN' | 'URGENT' | 'NORMAL' | 'PLANNED';

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  LINE_DOWN: { color: colors.danger, label: 'HAT DURDU' },
  URGENT: { color: colors.warning, label: 'Acil' },
  NORMAL: { color: colors.blue, label: 'Normal' },
  PLANNED: { color: colors.textMuted, label: 'Planlı' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];

  return (
    <View style={[styles.badge, { borderColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text variant="caption" color="textPrimary" style={{ fontWeight: '700' }}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
});