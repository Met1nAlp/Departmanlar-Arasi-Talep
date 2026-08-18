// src/design-system/components/Button.tsx
import { ActivityIndicator, ViewStyle } from 'react-native';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors, radius, spacing } from '../tokens';

type Variant = 'primary' | 'secondary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  /** Maestro E2E selector'ları için (bkz. .maestro/*.yaml). */
  testID?: string;
}

const variantStyles: Record<Variant, { background: keyof typeof colors; textColor: keyof typeof colors }> = {
  primary: { background: 'blue', textColor: 'white' },
  secondary: { background: 'surface', textColor: 'blue' },
  danger: { background: 'danger', textColor: 'white' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  testID,
}: Props) {
  const { background, textColor } = variantStyles[variant];
  const isInactive = disabled || loading;

  const baseStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    opacity: isInactive ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: colors.blue,
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isInactive}
      background={background}
      radius="md"
      style={style ? [baseStyle, style] : baseStyle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <Text variant="bodyBold" color={textColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}