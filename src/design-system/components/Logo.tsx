// src/design-system/components/Logo.tsx
import { Image, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

export function Logo({ size = 64 }: Props) {
  return (
    <Image
      source={require('../../../assets/mepsan-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}