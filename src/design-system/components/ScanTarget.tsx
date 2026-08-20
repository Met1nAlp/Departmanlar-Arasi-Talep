// src/design-system/components/ScanTarget.tsx
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors, spacing, radius } from '../tokens';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  // Yanlış parça okutulduğunda tam ekran kırmızı uyarı için (Efe'nin E6 maddesiyle bağlanacak)
  errorMode?: boolean;
  hint: string;
  onManualEntry: () => void;
  manualEntryLabel?: string;
  torchOn: boolean;
  onToggleTorch: () => void;
  footerNote?: string;
}

const FRAME_HEIGHT = 220;

// Kameranın ÜZERİNE bindirilen overlay katmanı — kameranın kendisini kırpmaz,
// bu yüzden daha önce yaşadığımız siyah ekran sorununu tetiklemez.
// CameraView'in dışında, ayrı bir katman olarak kullanılmalı (bkz. QRScanScreen).
export function ScanTarget({
  title,
  subtitle,
  onBack,
  errorMode = false,
  hint,
  onManualEntry,
  manualEntryLabel = 'Kod Gir',
  torchOn,
  onToggleTorch,
  footerNote,
}: Props) {
  const insets = useSafeAreaInsets();
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  const frameColor = errorMode ? colors.danger : colors.blue;

  return (
    // RN 0.86 (Expo 57) tiplerinde StyleSheet.absoluteFillObject kaldırıldı;
    // absoluteFill aynı dolgu davranışını verir.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="auto">
        <Pressable onPress={onBack} background="black" style={styles.backButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <View>
          <Text variant="h2" color="white">
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color="white" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.frameArea} pointerEvents="none">
        <View style={styles.frame}>
          {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
            <View key={corner} style={[styles.corner, cornerStyles[corner], { borderColor: frameColor }]} />
          ))}
          <Animated.View
            style={[
              styles.scanLine,
              {
                backgroundColor: frameColor,
                transform: [
                  {
                    translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [8, FRAME_HEIGHT - 8] }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.hintRow} pointerEvents="none">
        <View style={styles.hintPill}>
          <Ionicons name="information-circle-outline" size={16} color={colors.white} />
          <Text variant="caption" color="white" style={styles.hintText}>
            {hint}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]} pointerEvents="auto">
        <Stack>
          <Pressable
            onPress={onManualEntry}
            background="black"
            radius="md"
            style={styles.manualEntryButton}
            accessibilityLabel={manualEntryLabel}
          >
            <Ionicons name="keypad-outline" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
            <Text variant="bodyBold" color="white">
              {manualEntryLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleTorch}
            background="black"
            radius="md"
            style={{
              ...styles.torchButton,
              ...(torchOn ? { borderWidth: 2, borderColor: colors.blue } : null),
            }}
            accessibilityLabel="Fener"
          >
            <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={20} color={colors.white} />
          </Pressable>
        </Stack>
        {footerNote && (
          <Text variant="caption" color="white" style={styles.footerNote}>
            {footerNote}
          </Text>
        )}
      </View>
    </View>
  );
}

// Alt kontrol satırı için hafif bir row wrapper — Stack primitifi burada
// import döngüsüne girmemesi için (design-system/components -> primitives yönü zaten var).
function Stack({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const cornerStyles = StyleSheet.create({
  topLeft: { top: 0, left: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: radius.sm },
  topRight: { top: 0, right: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: radius.sm },
  bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: radius.sm },
  bottomRight: { bottom: 0, right: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: radius.sm },
});

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backButton: {
    marginRight: spacing.md,
    opacity: 0.6,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  frameArea: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    height: FRAME_HEIGHT,
  },
  frame: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  },
  hintRow: {
    position: 'absolute',
    top: '30%',
    marginTop: FRAME_HEIGHT + spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: {
    marginLeft: spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualEntryButton: {
    flex: 1,
    flexDirection: 'row',
    opacity: 0.85,
  },
  torchButton: {
    width: 64,
    opacity: 0.85,
  },
  footerNote: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: spacing.sm,
  },
});
