// src/components/RequestCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { Request } from '../types';
import { Box } from '../design-system/primitives/Box';
import { Stack } from '../design-system/primitives/Stack';
import { Text } from '../design-system/primitives/Text';
import { Pressable } from '../design-system/primitives/Pressable';
import { StatusChip, ChipStatus, toneStyle } from '../design-system/components/StatusChip';
import { colors, spacing, radius } from '../design-system/tokens';
import { statusSurfaces } from '../design-system/tokens/colors';
import { scale } from '../design-system/tokens/scale';
import { isPartial } from '../domain/request/predicates';

type Action = { label: string; hint?: string; onPress: () => void };

type Props = {
  request: Request;
  productName?: string;
  /** Saha tarafında departman, depo tarafında talep eden. */
  meta?: string;
  /** "adet" dışında bir birim varsa. */
  unit?: string;
  /** Kartın altındaki renkli eylem şeridi — sadece iş yapılabilir durumlarda. */
  action?: Action;
  onPress: () => void;
};

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export default function RequestCard({
  request,
  productName,
  meta,
  unit = 'adet',
  action,
  onPress,
}: Props) {
  const partial = isPartial(request);
  const chipStatus: ChipStatus = partial ? 'KISMI' : request.status;
  const urgent = request.priority === 'ACIL' && request.status !== 'TESLIM_EDILDI';
  const tone = toneStyle(chipStatus);

  // Eylem şeridi olan kart çerçevesini de durum renginden alıyor; listede
  // "gidip alınacak olan" kart tek bakışta ayrışıyor.
  const borderColor = action
    ? statusSurfaces.successBorder
    : urgent
      ? statusSurfaces.dangerBorder
      : colors.border;

  return (
    <Pressable
      onPress={onPress}
      radius="md"
      style={{
        width: '100%',
        padding: 0,
        alignItems: 'stretch',
        backgroundColor: urgent ? statusSurfaces.dangerSurface : colors.white,
        borderWidth: 0.5,
        borderColor,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
      accessibilityLabel={`${productName ?? 'Ürün'}, ${request.quantity} ${unit}`}
    >
      <Box style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <Stack direction="row" justify="space-between" align="flex-start" gap="sm">
          <Text variant="bodyBold" numberOfLines={2} style={{ flex: 1, lineHeight: scale(20) }}>
            {productName ?? '—'}
          </Text>
          {urgent ? (
            <Stack
              direction="row"
              align="center"
              gap="xs"
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.xs,
                paddingVertical: 3,
              }}
            >
              <Ionicons name="alert-circle" size={13} color={statusSurfaces.dangerText} />
              <Text
                variant="caption"
                style={{ color: statusSurfaces.dangerText, fontWeight: '600', fontSize: 11 }}
              >
                Acil
              </Text>
            </Stack>
          ) : (
            <StatusChip status={chipStatus} />
          )}
        </Stack>

        {/* Miktar ekranın en çok okunan verisi — tipografik olarak da öyle. */}
        <Stack direction="row" align="baseline" gap="xs" style={{ marginTop: spacing.xs }}>
          <Text style={{ fontSize: scale(22), fontWeight: '600', color: colors.textPrimary }}>
            {partial ? request.fulfilledQuantity : request.quantity}
          </Text>
          {partial && (
            <Text variant="body" color="textMuted">
              / {request.quantity}
            </Text>
          )}
          <Text variant="caption" color="textSecondary">
            {partial ? `${unit} hazır` : unit}
          </Text>
          {meta && (
            <Text variant="caption" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
              · {meta}
            </Text>
          )}
          <Text variant="caption" color="textMuted" style={{ marginLeft: 'auto' }}>
            {relativeTime(request.createdAt)}
          </Text>
        </Stack>

        {partial && (
          <Box
            style={{
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.surface,
              marginTop: spacing.xs,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                width: `${Math.round((request.fulfilledQuantity! / request.quantity) * 100)}%`,
                height: '100%',
                backgroundColor: statusSurfaces.warningBar,
              }}
            />
          </Box>
        )}
      </Box>

      {action && (
        <Stack
          direction="row"
          justify="space-between"
          align="center"
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: tone.surface,
          }}
        >
          <Text variant="caption" style={{ color: tone.text, flexShrink: 1 }} numberOfLines={1}>
            {action.hint}
          </Text>
          <Stack direction="row" align="center" gap="xs">
            <Text variant="caption" style={{ color: tone.text, fontWeight: '600' }}>
              {action.label}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={tone.text} />
          </Stack>
        </Stack>
      )}
    </Pressable>
  );
}
