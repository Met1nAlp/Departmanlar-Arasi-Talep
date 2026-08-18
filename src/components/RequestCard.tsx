// src/components/RequestCard.tsx
import { Request } from '../types';
import { Box } from '../design-system/primitives/Box';
import { Stack } from '../design-system/primitives/Stack';
import { Text } from '../design-system/primitives/Text';
import { Pressable } from '../design-system/primitives/Pressable';
import StatusBadge from './StatusBadge';
import { spacing } from '../design-system/tokens';

interface Props {
  request: Request;
  productName: string;
  onPress?: () => void;
}

export default function RequestCard({ request, productName, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{ width: '100%', minHeight: undefined }}>
      <Box padding="md" background="surface" radius="md" border style={{ width: '100%' }}>
        <Stack direction="row" justify="space-between" align="center">
          <Text variant="bodyBold">{productName}</Text>
          <StatusBadge status={request.status} />
        </Stack>
        <Text variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>
          Adet: {request.quantity}
        </Text>
      </Box>
    </Pressable>
  );
}