// src/design-system/components/ConfirmSheet.tsx
import { Modal, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { Button } from './Button';
import { Stack } from '../primitives/Stack';
import { colors, spacing } from '../tokens';

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

// Kritik eylemler için tam ekran onay katmanı (teslim onayı, iptal, yanlış parça uyarısı gibi).
// Yanlışlıkla dokunmayı zorlaştırmak için ekranın tamamını kaplar, arkaya dokunarak kapatılamaz.
export function ConfirmSheet({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {variant === 'danger' && (
            <Ionicons name="warning-outline" size={40} color={colors.danger} style={styles.icon} />
          )}
          <Text variant="h2" color="textPrimary" style={styles.title}>
            {title}
          </Text>
          {description && (
            <Text variant="body" color="textSecondary" style={styles.description}>
              {description}
            </Text>
          )}
          <Stack direction="column" gap="sm" style={styles.actions}>
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={variant === 'danger' ? 'danger' : 'primary'}
            />
            <Button label={cancelLabel} onPress={onCancel} variant="secondary" />
          </Stack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    width: '100%',
    marginTop: spacing.lg,
  },
});