// src/screens/departman-yetkilisi/RequestDetailScreen.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { RequestStatusStrip } from '../../design-system/components/RequestStatusStrip';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing } from '../../design-system/tokens';
import { statusLabels, statusOrder } from '../../utils/statusLabels';
import { getRequestById, updateRequestStatus } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import {
  LEGACY_NEXT_STATUS as nextStatusMap,
  LEGACY_NEXT_ACTION_LABEL as nextActionLabel,
  canAdvanceLegacyStatus,
} from '../../domain/request/legacyAdapter';

// Durum geçişleri ve etiketleri artık domain/request/legacyAdapter.ts içinde
// tek doğru kaynak olarak tutuluyor (Plan Bölüm 6.3 RBAC + Bölüm 7.1 durum
// makinesiyle hizalı). Bu ekran o katmandan okur — kendi kuralını icat etmez.

type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;
type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;

// Sadece "Hazır" ve sonraki adımlar onay ister — departmanı taahhüt altına
// sokan kritik geçişler bunlar. "Hazırlamaya Başla" geri dönüşü kolay olduğu için onaysız.
const stepsRequiringConfirm: RequestStatus[] = ['HAZIRLANIYOR', 'HAZIR'];

// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok (Efe'nin E1 maddesi) —
// IncomingRequestsScreen'deki aynı yer tutucuyla tutarlı.
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

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
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
    const updated = await updateRequestStatus(request.id, next);
    setRequest(updated);
    setUpdating(false);
  };

  if (!request) return <LoadingView />;

  const next = nextStatusMap[request.status];
  // RBAC: Plan Bölüm 6.3'e göre "Hazırlandı onayı" yalnızca SUPPLIER+ yapabilir.
  // Rol kontrolü ekranda değil RequestPolicies üzerinden (bkz. legacyAdapter).
  const allowedToAdvance = user ? canAdvanceLegacyStatus(user.role) : false;
  const currentIndex = statusOrder.indexOf(request.status);

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
            <Text variant="h2" color="white">
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
          <DetailRow label="Adet" value={`${request.quantity} adet`} />
        </Box>

        {next && allowedToAdvance ? (
          <View style={{ marginTop: 'auto' }}>
            <Button label={nextActionLabel[request.status]!} onPress={handleAdvancePress} loading={updating} />
            <Button
              label="Bu Talebi Reddet"
              onPress={() => navigation.navigate('RejectRequest', { requestId: request.id })}
              variant="dangerOutline"
              style={{ marginTop: spacing.sm }}
            />
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
