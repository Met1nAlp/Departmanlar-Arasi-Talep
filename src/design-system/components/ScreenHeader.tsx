// src/design-system/components/ScreenHeader.tsx
import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { colors, spacing, radius } from '../tokens';
import { statusSurfaces } from '../tokens/colors';
import { scale } from '../tokens/scale';

type Tone = 'blue' | 'danger';

type Props = {
  /** Ekranın adı. Tek başına kullanıldığında büyük başlık olur. */
  title: string;
  /** Başlığın üstündeki küçük satır — talep no, ekran adı gibi. */
  overline?: string;
  /** Başlığın altındaki küçük satır — kullanıcı adı, sayaç gibi. */
  subtitle?: string;
  /** Verilirse solda geri butonu çıkar ve başlık küçülür. */
  onBack?: () => void;
  /** Sağdaki aksiyonlar (NotificationBell, ayarlar vb.). */
  right?: ReactNode;
  tone?: Tone;
  /** Sekmeler, istatistikler — header'ın alt bölümüne yerleşir. */
  children?: ReactNode;
};

const TONE = {
  blue: { bg: colors.blue, sub: statusSurfaces.blueSubtle, chip: 'rgba(255,255,255,0.16)' },
  danger: { bg: colors.danger, sub: statusSurfaces.dangerSubtle, chip: 'rgba(255,255,255,0.18)' },
};

export function ScreenHeader({
  title,
  overline,
  subtitle,
  onBack,
  right,
  tone = 'blue',
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const palette = TONE[tone];
  const compact = !!onBack;

  return (
    <Box
      style={{
        backgroundColor: palette.bg,
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.md,
        // Sekme/istatistik varsa alt boşluğu children kendi veriyor.
        paddingBottom: children ? 0 : spacing.md,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
      }}
    >
      <Stack direction="row" align={compact ? 'center' : 'flex-start'} gap="sm">
        {onBack && (
          <Pressable
            onPress={onBack}
            radius="md"
            style={{
              width: scale(40),
              height: scale(40),
              backgroundColor: palette.chip,
              flexShrink: 0,
            }}
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
        )}

        <Box style={{ flex: 1, flexShrink: 1 }}>
          {overline && (
            <Text variant="caption" style={{ color: palette.sub }} numberOfLines={1}>
              {overline}
            </Text>
          )}
          <Text
            variant={compact ? 'h2' : 'h1'}
            color="white"
            numberOfLines={compact ? 1 : 2}
            style={{ letterSpacing: -0.3 }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" style={{ color: palette.sub, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </Box>

        {right && (
          <Stack direction="row" gap="sm" style={{ flexShrink: 0 }}>
            {right}
          </Stack>
        )}
      </Stack>

      {children}
    </Box>
  );
}

/** Header içindeki yuvarlak ikon butonu — bell/ayarlar için ortak kabuk. */
export function HeaderAction({
  icon,
  onPress,
  label,
  badge,
  tone = 'blue',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  badge?: boolean;
  tone?: Tone;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: scale(40),
        height: scale(40),
        borderRadius: 999,
        backgroundColor: TONE[tone].chip,
      }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.white} />
      {badge && (
        <Box
          style={{
            position: 'absolute',
            top: scale(8),
            right: scale(9),
            width: scale(8),
            height: scale(8),
            borderRadius: 999,
            backgroundColor: colors.warning,
          }}
        />
      )}
    </Pressable>
  );
}

type Tab<T extends string> = { key: T; label: string; count?: number };

/**
 * Alt çizgili sekmeler. Eskiden blueDark içine beyaz hap koyan segment
 * kontrol vardı; görsel ağırlığı içerikle yarışıyordu ve sayı sığmıyordu.
 */
export function HeaderTabs<T extends string>({
  tabs,
  value,
  onChange,
  right,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (key: T) => void;
  right?: ReactNode;
}) {
  return (
    <Stack direction="row" align="center" gap="lg" style={{ marginTop: spacing.md }}>
      {tabs.map(({ key, label, count }) => {
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{
              paddingBottom: spacing.sm,
              paddingHorizontal: 0,
              alignItems: 'flex-start',
              borderBottomWidth: 2.5,
              borderBottomColor: selected ? colors.white : 'transparent',
            }}
            accessibilityLabel={count !== undefined ? `${label}, ${count} adet` : label}
          >
            <Stack direction="row" align="center" gap="xs">
              <Text
                variant="body"
                style={{
                  color: selected ? colors.white : statusSurfaces.blueMuted,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {label}
              </Text>
              {count !== undefined && count > 0 && (
                <Text variant="caption" style={{ color: statusSurfaces.blueSubtle }}>
                  {count}
                </Text>
              )}
            </Stack>
          </Pressable>
        );
      })}
      {right && <Box style={{ marginLeft: 'auto', paddingBottom: spacing.sm }}>{right}</Box>}
    </Stack>
  );
}
