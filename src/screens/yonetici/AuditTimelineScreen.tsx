import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request, RequestStatus } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { LoadingView } from '../../design-system/components/LoadingView';
import { statusLabels, statusOrder } from '../../utils/statusLabels';
import { colors, spacing, statusTokens } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Rt = RouteProp<YoneticiStackParamList, 'AuditTimeline'>;

const STEP_TIMESTAMP_KEY: Record<RequestStatus, keyof Request> = {
  TALEP_ALINDI: 'createdAt',
  HAZIRLANIYOR: 'preparedAt',
  HAZIR: 'readyAt',
  YOLDA: 'onTheWayAt',
  TESLIM_EDILDI: 'deliveredAt',
  IPTAL_EDILDI: 'cancelledAt',
  REDDEDILDI: 'rejectedAt',
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function AuditTimelineScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      setRequest(req);
      const [product] = await getProductsByIds([req.productId]);
      setProductName(product?.name ?? '');
    });
  }, [route.params.requestId]);

  if (!request) return <LoadingView />;

  const currentIndex = statusOrder.indexOf(request.status);

  const handleShare = () => {
    const lines = statusOrder.map((status) => {
      const timestamp = request[STEP_TIMESTAMP_KEY[status]] as string | undefined;
      return `${statusLabels[status]}: ${timestamp ? formatDateTime(timestamp) : 'Henüz gerçekleşmedi'}`;
    });
    Share.share({
      title: `${request.id.toUpperCase()} · Denetim Kaydı`,
      message: `${request.id.toUpperCase()} · ${productName}\n\n${lines.join('\n')}`,
    });
  };

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {request.id.toUpperCase()} · DENETİM KAYDI
            </Text>
            <Text variant="h2" color="white" numberOfLines={1} style={{ flexShrink: 1 }}>
              {productName}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md" padding="md">
          {statusOrder.map((status, index) => {
            const isDone = index <= currentIndex;
            const isLast = index === statusOrder.length - 1;
            const timestamp = request[STEP_TIMESTAMP_KEY[status]] as string | undefined;

            return (
              <Stack key={status} direction="row" gap="md">
                <Stack style={{ alignItems: 'center' }}>
                  <Box
                    background={isDone ? 'blue' : 'white'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isDone ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons
                      name={statusTokens[status].icon as any}
                      size={16}
                      color={isDone ? colors.white : colors.textMuted}
                    />
                  </Box>
                  {!isLast && (
                    <Box style={{ width: 2, flex: 1, backgroundColor: isDone ? colors.blue : colors.border }} />
                  )}
                </Stack>
                <Box style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg }}>
                  <Text variant="bodyBold" color={isDone ? 'textPrimary' : 'textMuted'}>
                    {statusLabels[status]}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    {timestamp ? formatDateTime(timestamp) : 'Henüz gerçekleşmedi'}
                  </Text>
                </Box>
              </Stack>
            );
          })}
        </Box>
      </Box>

      <Box padding="md" style={{ paddingTop: 0, paddingBottom: insets.bottom + spacing.md }}>
        <Pressable
          onPress={handleShare}
          background="white"
          radius="md"
          style={{ width: '100%', borderWidth: 1, borderColor: colors.border, flexDirection: 'row' }}
        >
          <Ionicons name="download-outline" size={18} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
          <Text variant="bodyBold">Denetim Kaydını Paylaş</Text>
        </Pressable>
      </Box>
    </Box>
  );
}
