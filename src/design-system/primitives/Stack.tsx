// src/design-system/primitives/Stack.tsx
import { View, ViewProps, ViewStyle } from 'react-native';
import { spacing } from '../tokens';

type SpacingKey = keyof typeof spacing;

interface Props extends ViewProps {
  direction?: 'row' | 'column';
  gap?: SpacingKey;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: ViewStyle | ViewStyle[];
}

// Yan yana ya da alt alta dizilmiş elemanlar için — "flexDirection + gap" kombinasyonunu
// her ekranda elle yazmak yerine tek bileşenden.
export function Stack({
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  style,
  children,
  ...rest
}: Props) {
  return (
    <View
      style={[
        {
          flexDirection: direction,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...(gap && { gap: spacing[gap] }),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}