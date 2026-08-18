// src/design-system/primitives/Box.tsx
import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, spacing, radius, elevation } from '../tokens';

type SpacingKey = keyof typeof spacing;
type ColorKey = keyof typeof colors;
type RadiusKey = keyof typeof radius;
type ElevationKey = keyof typeof elevation;

interface Props extends ViewProps {
  padding?: SpacingKey;
  paddingHorizontal?: SpacingKey;
  paddingVertical?: SpacingKey;
  margin?: SpacingKey;
  marginTop?: SpacingKey;
  marginBottom?: SpacingKey;
  background?: ColorKey;
  radius?: RadiusKey;
  border?: boolean;
  elevation?: ElevationKey;
  style?: ViewStyle | ViewStyle[];
}

// Kart, konteyner, bölücü gibi her "kutu" ihtiyacı buradan geçer.
// Elle StyleSheet yazmak yerine token isimleriyle prop veriliyor.
export function Box({
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginTop,
  marginBottom,
  background,
  radius: radiusKey,
  border,
  elevation: elevationKey,
  style,
  children,
  ...rest
}: Props) {
  const computedStyle: ViewStyle = {
    ...(padding && { padding: spacing[padding] }),
    ...(paddingHorizontal && { paddingHorizontal: spacing[paddingHorizontal] }),
    ...(paddingVertical && { paddingVertical: spacing[paddingVertical] }),
    ...(margin && { margin: spacing[margin] }),
    ...(marginTop && { marginTop: spacing[marginTop] }),
    ...(marginBottom && { marginBottom: spacing[marginBottom] }),
    ...(background && { backgroundColor: colors[background] }),
    ...(radiusKey && { borderRadius: radius[radiusKey] }),
    ...(border && { borderWidth: 1, borderColor: colors.border }),
    ...(elevationKey && (elevation as any)[elevationKey]),
  };

  return (
    <View style={[computedStyle, style]} {...rest}>
      {children}
    </View>
  );
}