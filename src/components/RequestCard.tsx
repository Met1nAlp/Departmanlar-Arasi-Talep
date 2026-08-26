// src/components/RequestCard.tsx
import { Request } from '../types';
import { Box } from '../design-system/primitives/Box';
import { Stack } from '../design-system/primitives/Stack';
import { Text } from '../design-system/primitives/Text';
import { Pressable } from '../design-system/primitives/Pressable';
import { PriorityBadge } from '../design-system/components/PriorityBadge';
import StatusBadge from './StatusBadge';
import { spacing, colors } from '../design-system/tokens';

interface Props {
  request: Request;
  productName: string;
  departmentName?: string;
  onPress?: () => void;
}

export default function RequestCard({ request, productName, departmentName, onPress }: Props) {
  const isCancelledOrRejected = request.status === 'IPTAL_EDILDI' || request.status === 'REDDEDILDI';
  const priority = request.priority;

  return (
    <Pressable onPress={onPress} style={{ width: '100%', minHeight: undefined }}>
      <Box
        padding="md"
        background={isCancelledOrRejected ? 'dangerLight' : 'surface'}
        radius="md"
        border
        style={{
          width: '100%',
          borderLeftWidth: 4,
          borderLeftColor: isCancelledOrRejected ? colors.danger : 'transparent',
          opacity: isCancelledOrRejected ? 0.75 : 1,
        }}
      >
        <Text variant="bodyBold" numberOfLines={1}>
          {productName}
        </Text>
        {departmentName ? (
          <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
            {departmentName}
          </Text>
        ) : null}

        <Stack direction="row" justify="space-between" align="flex-end" style={{ marginTop: spacing.sm }}>
          <PriorityBadge priority={priority} />
          <Stack align="flex-end" gap="xs">
            <Text variant="caption" color="textSecondary">
              Adet: {request.quantity}
            </Text>
            <StatusBadge status={request.status} />
          </Stack>
        </Stack>
      </Box>
    </Pressable>
  );
}