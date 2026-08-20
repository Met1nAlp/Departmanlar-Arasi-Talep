// src/design-system/components/StatusChip.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { statusTokens, RequestStatusKey } from '../tokens';
import { radius, spacing } from '../tokens';

interface Props {
  status: RequestStatusKey;
  compact?: boolean; // true: sadece ikon, alanı çok dar yerlerde (örn. tablo hücresi)
}

// StatusBadge'in kompakt kardeşi — filtre çubukları, kuyruk listesi gibi
// dar alanlarda kullanılır. Aynı statusTokens'tan besleniyor, tek kaynak korunuyor.
export function StatusChip({ status, compact = false }: Props) {
  const token = statusTokens[status];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: token.bgColor },
        compact && styles.chipCompact,
      ]}
      accessibilityLabel={token.label}
    >
      <Ionicons name={token.icon as any} size={compact ? 14 : 12} color={token.color} />
      {!compact && (
        <Text variant="caption" color={token.color === '#FFFFFF' ? 'white' : 'textPrimary'} style={styles.label}>
          {token.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999, // tam yuvarlak, sadece ikon barındıran daire
  },
  label: {
    marginLeft: 4,
  },
});