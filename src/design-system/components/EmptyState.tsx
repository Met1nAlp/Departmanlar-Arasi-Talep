// src/design-system/components/EmptyState.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { Button } from './Button';
import { colors, spacing } from '../tokens';
import { scale } from '../tokens/scale';

interface Props {
  icon?: string; // Ionicons ismi
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary';
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

// Boş liste, boş kuyruk, arama sonucu yok gibi tüm durumlar bu bileşenden geçmeli.
// Sadece "Kayıt yok" demek yeterli değil — ne yapılacağını da söylemeli (PDF M3 kuralı).
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'secondary',
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={scale(48)} color={colors.textMuted} />
      <Text variant="h2" color="textSecondary" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color="textMuted" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={actionVariant}
          fullWidth={false}
          style={styles.action}
        />
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <Button
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="secondary"
          fullWidth={false}
          style={styles.secondaryAction}
        />
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
  secondaryAction: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});