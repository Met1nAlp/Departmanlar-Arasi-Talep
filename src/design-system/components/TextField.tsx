// src/design-system/components/TextField.tsx
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { colors, spacing, radius, typography } from '../tokens';

interface Props extends TextInputProps {
  label?: string;
  icon?: string; // Ionicons ismi, örn. "search-outline"
  error?: string;
}

export function TextField({ label, icon, error, style, ...rest }: Props) {
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.inputRow, error && { borderColor: colors.danger }]}>
        {icon && <Ionicons name={icon as any} size={20} color={colors.textMuted} style={styles.icon} />}
        <TextInput
          style={[typography.body, styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
      </View>
      {error && (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56, // dokunma/odaklama alanı fabrika ortamı için yeterince büyük
    backgroundColor: colors.white,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
  },
});