// src/design-system/components/RequestOrderGroupCard.tsx
//
// Aynı sepetten (orderId) gelen birden fazla talep, listede ayrı ayrı kart
// olarak DEĞİL, tek bir "sipariş" kartı altında gruplanmalı (bkz.
// domain/request/groupByOrder.ts). Grup tek talepten oluşuyorsa hiçbir
// sarmalama yapmadan doğrudan renderItem'ı döner — mevcut tekil görünüm
// birebir korunur.

import { useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { RequestOrderGroup } from '../../domain/request/groupByOrder';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { colors, spacing } from '../tokens';
import { scale } from '../tokens/scale';

interface Props {
  group: RequestOrderGroup;
  /** Kapalı başlıkta görünen ana metin — örn. departman adı ya da ilk ürün adı. */
  title: string;
  /** Başlığın sağındaki özet — örn. "3 kalem · 7 adet". */
  subtitle?: string;
  renderItem: (request: RequestOrderGroup['requests'][number]) => ReactNode;
}

export function RequestOrderGroupCard({ group, title, subtitle, renderItem }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (group.requests.length === 1) {
    return <>{renderItem(group.requests[0])}</>;
  }

  return (
    <Box background="surface" radius="md" style={{ overflow: 'hidden' }}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
        accessibilityLabel={`${title} siparişindeki kalemleri ${expanded ? 'gizle' : 'göster'}`}
      >
        <Stack direction="row" align="center" gap="sm" style={{ flex: 1, marginRight: spacing.sm }}>
          <Ionicons name="layers-outline" size={scale(16)} color={colors.blue} />
          <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
        </Stack>
        <Stack direction="row" align="center" gap="xs">
          {subtitle && (
            <Text variant="caption" color="textMuted">
              {subtitle}
            </Text>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={scale(16)} color={colors.textMuted} />
        </Stack>
      </Pressable>

      {expanded && (
        <Box style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
          <Box style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.sm, marginHorizontal: spacing.sm }} />
          <Stack gap="sm">
            {group.requests.map((request) => (
              <Box key={request.id}>{renderItem(request)}</Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
