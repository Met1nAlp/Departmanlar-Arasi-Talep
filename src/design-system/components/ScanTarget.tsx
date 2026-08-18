// src/design-system/components/ScanTarget.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors, spacing } from '../tokens';

interface Props {
  instruction: string;
  onBack: () => void;
  // Yanlış parça okutulduğunda tam ekran kırmızı uyarı için (Efe'nin E6 maddesiyle bağlanacak)
  errorMode?: boolean;
}

// Kameranın ÜZERİNE bindirilen overlay katmanı — kameranın kendisini kırpmaz,
// bu yüzden daha önce yaşadığımız siyah ekran sorununu tetiklemez.
// CameraView'in dışında, ayrı bir katman olarak kullanılmalı (bkz. QRScanScreen).
export function ScanTarget({ instruction, onBack, errorMode = false }: Props) {
  // RN 0.86 (Expo 57) tiplerinde StyleSheet.absoluteFillObject kaldırıldı;
  // absoluteFill aynı dolgu davranışını verir.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.topBar} pointerEvents="auto">
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text variant="body" color="white">
          {instruction}
        </Text>
      </View>

      <View
        style={[
          styles.frame,
          errorMode && { borderColor: colors.danger, borderWidth: 4 },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    marginRight: spacing.md,
  },
  frame: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    right: '15%',
    height: 220,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
});