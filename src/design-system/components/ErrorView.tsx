// src/design-system/components/ErrorView.tsx
import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { Button } from './Button';
import { colors, spacing } from '../tokens';
import { scale } from '../tokens/scale';

interface Props {
  icon?: string; // Ionicons ismi
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Örn. "Kuyrukta bekleyen · 2 talep" gibi ek bir bilgi satırı. */
  extra?: ReactNode;
}

// PDF'in "tüm await çağrıları try/catch'siz, ağ hatasında ekran sessizce donuyor"
// tespitine karşılık — her hata durumu artık bu bileşenden geçmeli.
export function ErrorView({
  icon = 'alert-circle-outline',
  title,
  message = 'Bir şeyler ters gitti',
  onRetry,
  retryLabel = 'Tekrar Dene',
  secondaryLabel,
  onSecondary,
  extra,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={scale(48)} color={colors.danger} />
      {title && (
        <Text variant="h2" color="textSecondary" style={styles.title}>
          {title}
        </Text>
      )}
      <Text variant="body" color="textSecondary" style={styles.message}>
        {message}
      </Text>
      {extra && <View style={styles.extra}>{extra}</View>}
      {onRetry && (
        <Button label={retryLabel} onPress={onRetry} variant="primary" fullWidth={false} style={styles.retry} />
      )}
      {secondaryLabel && onSecondary && (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="secondary"
          fullWidth={false}
          style={styles.secondary}
        />
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
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  extra: {
    marginTop: spacing.lg,
    width: '100%',
  },
  retry: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  secondary: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});