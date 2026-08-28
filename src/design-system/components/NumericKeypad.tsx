// src/design-system/components/NumericKeypad.tsx
import { View, StyleSheet } from 'react-native';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';
import { scale } from '../tokens/scale';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'];

export function NumericKeypad({ value, onChange, maxLength = 4 }: Props) {
  const handlePress = (key: string) => {
    if (key === 'clear') {
      onChange('');
    } else if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (value.length < maxLength) {
      onChange(value === '0' ? key : value + key);
    }
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => handlePress(key)}
          background="surface"
          radius="md"
          style={styles.key}
          accessibilityLabel={key === 'clear' ? 'Temizle' : key === 'backspace' ? 'Sil' : key}
        >
          {key === 'clear' ? (
            <Text variant="caption" color="textMuted" style={{ fontWeight: '700' }}>
              TEMİZLE
            </Text>
          ) : key === 'backspace' ? (
            <Ionicons name="backspace-outline" size={scale(24)} color={colors.textSecondary} />
          ) : (
            <Text variant="h2" color="textPrimary" style={{ fontWeight: '600' }}>
              {key}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  key: {
    width: '31.5%',
    height: scale(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});