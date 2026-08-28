// src/design-system/components/PriorityBadge.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';

export type Priority = 'ACIL' | 'NORMAL';

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  ACIL: { color: colors.amber, label: 'Acil' },
  NORMAL: { color: colors.blue, label: 'Normal' },
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