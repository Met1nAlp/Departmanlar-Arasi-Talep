// src/design-system/components/NumericKeypad.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

// Sistem klavyesi yerine — eldivenli elle, büyük dokunma alanlarıyla adet girişi.
// Pressable üzerine kurulu olduğu için her tuş zaten 64dp garanti altında.
export function NumericKeypad({ value, onChange, maxLength = 4 }: Props) {
  const handlePress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === '') {
      return; // boş hücre, dokunulamaz
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((key, index) => (
        <Pressable
          key={index}
          onPress={() => handlePress(key)}
          disabled={key === ''}
          background={key === '' ? undefined : 'surface'}
          radius="md"
          style={styles.key}
          accessibilityLabel={key === 'backspace' ? 'Sil' : key}
        >
          {key === 'backspace' ? (
            <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
          ) : (
            <Text variant="h1" color="textPrimary">
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
    gap: spacing.sm,
  },
  key: {
    width: '30%', // 3 sütunlu grid, gap'i telafi eden yaklaşık genişlik
    aspectRatio: 1,
  },
});