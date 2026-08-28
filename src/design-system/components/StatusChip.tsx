// src/design-system/components/StatusChip.tsx
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { spacing, radius, statusTokens } from '../tokens';
import { statusSurfaces, statusTone, StatusTone } from '../tokens/colors';
import { statusLabels } from '../../utils/statusLabels';
import { RequestStatus } from '../../types';

// "Kısmi" gerçek bir RequestStatus değil, HAZIRLANIYOR/HAZIR üzerindeki bir
// nitelik. Rozet tarafında ayrı bir tür gibi davranıyor.
export type ChipStatus = RequestStatus | 'KISMI';

const TONE_STYLES: Record<StatusTone, { surface: string; text: string }> = {
  accent: { surface: statusSurfaces.accentSurface, text: statusSurfaces.accentText },
  success: { surface: statusSurfaces.successSurface, text: statusSurfaces.successText },
  warning: { surface: statusSurfaces.warningSurface, text: statusSurfaces.warningText },
  danger: { surface: statusSurfaces.dangerSurface, text: statusSurfaces.dangerText },
  neutral: { surface: '#F0F2F5', text: '#5A626B' },
};

const KISMI = {
  tone: 'warning' as StatusTone,
  icon: 'ellipsis-horizontal-circle-outline' as const,
  label: 'Kısmi',
};

export function StatusChip({ status }: { status: ChipStatus }) {
  const isPartial = status === 'KISMI';
  const tone = isPartial ? KISMI.tone : statusTone[status] ?? 'neutral';
  const icon = isPartial ? KISMI.icon : (statusTokens[status as RequestStatus]?.icon as any);
  const label = isPartial ? KISMI.label : statusLabels[status as RequestStatus];
  const style = TONE_STYLES[tone];

  return (
    <Box
      style={{
        backgroundColor: style.surface,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.xs,
        paddingVertical: 3,
      }}
    >
      {/* Renk tek başına taşıyıcı değil: ikon ve metin de var. Güneş altında
          ve renk körlüğünde rozet yine okunuyor. */}
      <Stack direction="row" align="center" gap="xs">
        {icon && <Ionicons name={icon} size={13} color={style.text} />}
        <Text variant="caption" style={{ color: style.text, fontWeight: '600', fontSize: 11 }}>
          {label}
        </Text>
      </Stack>
    </Box>
  );
}

/** Durum ailesinin yüzey/metin rengini dışarı verir — kart şeritleri için. */
export function toneStyle(status: ChipStatus) {
  const tone = status === 'KISMI' ? 'warning' : statusTone[status] ?? 'neutral';
  return TONE_STYLES[tone];
}
