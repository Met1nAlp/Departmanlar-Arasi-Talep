// src/design-system/components/ErrorView.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { Button } from './Button';
import { colors, spacing } from '../tokens';

interface Props {
  message?: string;
  onRetry?: () => void;
}

// PDF'in "tüm await çağrıları try/catch'siz, ağ hatasında ekran sessizce donuyor"
// tespitine karşılık — her hata durumu artık bu bileşenden geçmeli.
export function ErrorView({ message = 'Bir şeyler ters gitti', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
      <Text variant="body" color="textSecondary" style={styles.message}>
        {message}
      </Text>
      {onRetry && (
        <Button label="Tekrar Dene" onPress={onRetry} variant="secondary" fullWidth={false} style={styles.retry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});