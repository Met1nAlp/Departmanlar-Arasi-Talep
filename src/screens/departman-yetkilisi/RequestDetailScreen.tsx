// src/screens/departman-yetkilisi/RequestDetailScreen.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Request, RequestStatus } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { RequestStatusStrip } from '../../design-system/components/RequestStatusStrip';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing } from '../../design-system/tokens';
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

export default function RequestDetailScreen() {
  const navigation = useNavigation<Nav>();
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

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <Text variant="h2">{productName}</Text>
      <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
        Adet: {request.quantity}
      </Text>

      <RequestStatusStrip currentStatus={request.status} />

      {next && allowedToAdvance ? (
        <View style={{ marginTop: spacing.md }}>
          <Button
            label={nextActionLabel[request.status]!}
            onPress={handleAdvancePress}
            loading={updating}
          />
          <Button
            label="Bu Talebi Reddet"
            onPress={() => navigation.navigate('RejectRequest', { requestId: request.id })}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : (
        <Text variant="body" color="textMuted" style={{ marginTop: spacing.lg }}>
          Bu talep için departman tarafında yapılacak başka işlem yok.
        </Text>
      )}

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