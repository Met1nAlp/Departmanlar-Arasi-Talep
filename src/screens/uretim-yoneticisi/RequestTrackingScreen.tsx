// src/screens/uretim-yoneticisi/RequestTrackingScreen.tsx
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { statusLabels, statusOrder } from '../../utils/statusLabels';
import { colors, spacing, statusTokens } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Rt = RouteProp<UretimYoneticisiStackParamList, 'RequestTracking'>;
type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'RequestTracking'>;

const STEP_TIMESTAMP_KEY: Record<string, keyof Request | undefined> = {
  TALEP_ALINDI: 'createdAt',
  HAZIRLANIYOR: 'preparedAt',
  HAZIR: 'readyAt',
  YOLDA: 'onTheWayAt',
  TESLIM_EDILDI: 'deliveredAt',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function RequestTrackingScreen() {
  const route = useRoute<Rt>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) {
        setNotFound(true);
        return;
      }
      setRequest(req);
      const products = await getProductsByIds([req.productId]);
      setProductName(products[0]?.name ?? '');
    });
  }, [route.params.requestId]);

  useRequestUpdates(setRequest, route.params.requestId);

  if (notFound) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <EmptyState
          icon="alert-circle-outline"
          title="Talep bulunamadı"
          description="Bu talep artık mevcut değil — silinmiş olabilir."
          actionLabel="Geri Dön"
          onAction={() => navigation.goBack()}
        />
      </Box>
    );
  }

  if (!request) return <LoadingView />;

  const currentIndex = statusOrder.indexOf(request.status);
  const allowedToConfirm = user ? canConfirmDelivery(user.role) : false;

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable
            onPress={() => navigation.goBack()}
            background="blueMedium"
            radius="md"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {request.id.toUpperCase()} · TALEP TAKİBİ
            </Text>
            <Text variant="h2" color="white" numberOfLines={1} style={{ flexShrink: 1 }}>
              {productName}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md" padding="md" style={{ marginBottom: spacing.md }}>
          <Stack direction="row" justify="space-between">
            <Text variant="body" color="textSecondary">
              Adet
            </Text>
            <Text variant="bodyBold">
              {request.fulfilledQuantity !== undefined && request.fulfilledQuantity < request.quantity
                ? `${request.fulfilledQuantity} / ${request.quantity} adet karşılandı`
                : `${request.quantity} adet`}
            </Text>
          </Stack>
        </Box>

        <Box background="surface" radius="md" padding="md">
          {statusOrder.map((status, index) => {
            const isDone = index <= currentIndex;
            const isLast = index === statusOrder.length - 1;
            const timestampKey = STEP_TIMESTAMP_KEY[status];
            const timestamp = timestampKey ? (request[timestampKey] as string | undefined) : undefined;

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
                    {timestamp ? formatTimestamp(timestamp) : 'Henüz gerçekleşmedi'}
                  </Text>
                </Box>
              </Stack>
            );
          })}
        </Box>
      </Box>

      <Box padding="md" style={{ paddingBottom: insets.bottom + spacing.md }}>
        {request.status === 'YOLDA' && allowedToConfirm && (
          <Button
            label="Ürünü Teslim Aldım"
            onPress={() => navigation.navigate('DeliveryConfirm', { requestId: request.id })}
          />
        )}
        {(request.status === 'TALEP_ALINDI' || request.status === 'HAZIRLANIYOR') && (
          <Button
            label="Talebi İptal Et"
            onPress={() => navigation.navigate('CancelRequest', { requestId: request.id })}
            variant="danger"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </Box>
    </Box>
  );
}
