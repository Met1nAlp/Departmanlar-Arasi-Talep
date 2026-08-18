// src/design-system/components/EmptyState.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { Button } from './Button';
import { colors, spacing } from '../tokens';

interface Props {
  icon?: string; // Ionicons ismi
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Boş liste, boş kuyruk, arama sonucu yok gibi tüm durumlar bu bileşenden geçmeli.
// Sadece "Kayıt yok" demek yeterli değil — ne yapılacağını da söylemeli (PDF M3 kuralı).
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={48} color={colors.textMuted} />
      <Text variant="h2" color="textSecondary" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color="textMuted" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});