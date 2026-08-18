// src/design-system/primitives/Pressable.tsx
import { Pressable as RNPressable, PressableProps, ViewStyle } from 'react-native';
import { colors, radius } from '../tokens';

interface Props extends PressableProps {
  background?: keyof typeof colors;
  radius?: keyof typeof radius;
  style?: ViewStyle | ViewStyle[];
  // Dokunma hedefi analiz dokümanının istediği 64dp altına düşmesin diye zorunlu değil ama varsayılan
  minTouchSize?: number;
}

// PDF'in M2 maddesi: "min 64dp dokunma hedefi" — bu varsayılan olarak burada garanti ediliyor.
// Eldivenli elle fabrika ortamında kullanılacağı için küçük dokunma alanları kabul edilemez.
export function Pressable({
  background,
  radius: radiusKey,
  style,
  minTouchSize = 64,
  children,
  ...rest
}: Props) {
  return (
    <RNPressable
      hitSlop={8}
      style={({ pressed }) => [
        {
          minHeight: minTouchSize,
          minWidth: minTouchSize,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
          ...(background && { backgroundColor: colors[background] }),
          ...(radiusKey && { borderRadius: radius[radiusKey] }),
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {children}
    </RNPressable>
  );
}