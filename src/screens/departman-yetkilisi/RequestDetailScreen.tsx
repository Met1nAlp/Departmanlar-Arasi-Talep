// src/screens/departman-yetkilisi/RequestDetailScreen.tsx
import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Request, RequestStatus } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { NumericKeypad } from '../../design-system/components/NumericKeypad';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { RequestStatusStrip } from '../../design-system/components/RequestStatusStrip';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing, radius } from '../../design-system/tokens';
import { statusLabels, statusOrder } from '../../utils/statusLabels';
import { getRequestById, updateRequestStatus, fulfillRequest } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { successFeedback } from '../../design-system/feedback';
import { useActiveUser } from '../../store/authStore';
import {
  LEGACY_NEXT_STATUS as nextStatusMap,
  LEGACY_NEXT_ACTION_LABEL as nextActionLabel,
  canAdvanceLegacyStatus,
} from '../../domain/request/legacyAdapter';

type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;
type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;

const stepsRequiringConfirm: RequestStatus[] = ['HAZIRLANIYOR', 'HAZIR'];

// Kısmi karşılama sadece bu iki adımda anlamlı — sonraki adımlarda
// (YOLDA, TESLIM_EDILDI) zaten miktar tartışması bitmiş olur.
const stepsAllowingPartial: RequestStatus[] = ['HAZIRLANIYOR'];

const FAKE_PRIORITY: Priority = 'NORMAL';

export default function RequestDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [partialModalVisible, setPartialModalVisible] = useState(false);
  const [partialQty, setPartialQty] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) {
        setNotFound(true);
        return;
      }
      setRequest(req);
      const [product] = await getProductsByIds([req.productId]);
      setProductName(product?.name ?? '');
    });
  }, [route.params.requestId]);

  const handleAdvancePress = () => {
    if (!request) return;
    const next = nextStatusMap[request.status];
    if (!next) return;

    if (stepsRequiringConfirm.includes(request.status)) {
      setConfirmVisible(true);
    } else {
      performAdvance();
    }
  };

  const performAdvance = async () => {
    if (!request) return;
    const next = nextStatusMap[request.status];
    if (!next) return;

    setConfirmVisible(false);
    setUpdating(true);
    await updateRequestStatus(request, next);
    void successFeedback();
    setUpdating(false);
    navigation.goBack();
  };

  const openPartialModal = () => {
    setPartialQty('');
    setPartialModalVisible(true);
  };

  const performPartialFulfill = async () => {
    if (!request) return;
    const next = nextStatusMap[request.status];
    if (!next) return;
    const qty = Number(partialQty);
    if (!qty || qty <= 0 || qty >= request.quantity) return;

    setPartialModalVisible(false);
    setUpdating(true);
    await fulfillRequest(request, next, qty);
    void successFeedback();
    setUpdating(false);
    navigation.goBack();
  };

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

  const next = nextStatusMap[request.status];
  const allowedToAdvance = user ? canAdvanceLegacyStatus(user.role) : false;
  const currentIndex = statusOrder.indexOf(request.status);
 const showPartialOption = next && allowedToAdvance && stepsAllowingPartial.includes(request.status);
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
              {request.id.toUpperCase()} · {FAKE_PRIORITY}
            </Text>
            <Text variant="h2" color="white" numberOfLines={1} style={{ flexShrink: 1 }}>
              {productName}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md" padding="md">
          <Stack direction="row" justify="space-between" align="center">
            <Text variant="caption" color="textMuted" style={{ letterSpacing: 1 }}>
              DURUM
            </Text>
            <Text variant="bodyBold" color="blue">
              {currentIndex + 1}/{statusOrder.length} · {statusLabels[request.status]}
            </Text>
          </Stack>
          <RequestStatusStrip currentStatus={request.status} />
        </Box>

        <Box background="surface" radius="md" style={{ marginTop: spacing.md }}>
          <DetailRow label="Talep Eden" value={request.requesterName ?? request.requesterId} />
          <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
          <DetailRow label="Adet" value={`${request.quantity} adet`} />
{request.fulfilledQuantity !== undefined && request.fulfilledQuantity > 0 && request.fulfilledQuantity < request.quantity && (            <>
              <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
              <DetailRow label="Karşılanan" value={`${request.fulfilledQuantity} / ${request.quantity} adet`} />
            </>
          )}
        </Box>

        {next && allowedToAdvance ? (
          <View style={{ marginTop: 'auto', paddingBottom: insets.bottom }}>
            <Button label={nextActionLabel[request.status]!} onPress={handleAdvancePress} loading={updating} />
            {showPartialOption && (
              <Button
                label="Kısmi Karşıla"
                onPress={openPartialModal}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
              />
            )}
            {request.status === 'TALEP_ALINDI' && (
              <Button
                label="Bu Talebi Reddet"
                onPress={() => navigation.navigate('RejectRequest', { requestId: request.id })}
                variant="dangerOutline"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        ) : (
          <Text variant="body" color="textMuted" style={{ marginTop: spacing.lg }}>
            Bu talep için departman tarafında yapılacak başka işlem yok.
          </Text>
        )}
      </Box>

      <ConfirmSheet
        visible={confirmVisible}
        title={nextActionLabel[request.status] ?? ''}
        description="Bu işlem geri alınamaz ve ilgili tarafa bildirim gönderilir. Onaylıyor musunuz?"
        confirmLabel="Onayla"
        onConfirm={performAdvance}
        onCancel={() => setConfirmVisible(false)}
      />

      <Modal
        visible={partialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPartialModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Box
            background="white"
            style={{
              padding: spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              alignItems: 'center',
            }}
          >
            <View
              style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.lg }}
            />
            <Text variant="h2" style={{ textAlign: 'center' }}>
              Kaç adet karşılayabiliyorsunuz?
            </Text>
            <Text variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md }}>
              İstenen {request.quantity} adet · kalan kısım için talep açık kalır
            </Text>
            <Text variant="h1" color="blue" style={{ textAlign: 'center', marginBottom: spacing.md, minHeight: 40 }}>
              {partialQty || '0'}
            </Text>
            <NumericKeypad value={partialQty} onChange={setPartialQty} maxLength={4} />
            <Stack style={{ width: '100%', marginTop: spacing.lg }}>
              <Button
                label="Onayla"
                onPress={performPartialFulfill}
                disabled={!partialQty || Number(partialQty) <= 0 || Number(partialQty) >= request.quantity}
              />
              <Button
                label="Vazgeç"
                onPress={() => setPartialModalVisible(false)}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
              />
            </Stack>
          </Box>
        </View>
      </Modal>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="space-between" style={{ padding: spacing.md }}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </Stack>
  );
}