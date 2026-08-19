// src/design-system/primitives/Text.tsx
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, typography } from '../tokens';

type Variant = keyof typeof typography;
type ColorKey = keyof typeof colors;

interface Props extends RNTextProps {
  variant?: Variant;
  color?: ColorKey;
  style?: TextStyle | TextStyle[];
}

// Tüm metin bu bileşenden geçmeli — ham RN Text kullanmak yerine,
// böylece tipografi/renk her zaman token'lardan gelir, ekrana gömülü rastgele fontSize olmaz
export function Text({ variant = 'body', color = 'textPrimary', style, children, ...rest }: Props) {
  return (
    <RNText style={[typography[variant], { color: colors[color] }, style]} {...rest}>
      {children}
    </RNText>
  );
}