// src/screens/saha-personeli/DeliveryConfirmScreen.tsx
import { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { spacing } from '../../design-system/tokens';
import { updateRequestStatus } from '../../api/requests';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [confirming, setConfirming] = useState(false);

  // RBAC savunması: bu ekrana yalnızca RequestTrackingScreen'den, yetkili bir
  // rolle geliniyor olması beklenir. Yine de derin bağlantı/rol değişimi gibi
  // durumlara karşı burada da kontrol edilir (bkz. RequestPolicies.canClose).
  const allowed = user ? canConfirmDelivery(user.role) : false;

  const handleConfirm = async () => {
    if (!allowed) return;
    setConfirming(true);
    await updateRequestStatus(route.params.requestId, 'TESLIM_EDILDI');
    setConfirming(false);
    navigation.popToTop();
  };

  return (
    <Box style={{ flex: 1, justifyContent: 'center' }} background="white" padding="lg">
      <Text variant="h2" style={{ textAlign: 'center' }}>
        Ürünü teslim aldığınızı onaylıyor musunuz?
      </Text>
      <Text variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.sm }}>
        Onayladığınızda ilgili departmana "Ürün İletildi" bildirimi gönderilecek.
      </Text>
      <Box style={{ marginTop: spacing.xl }}>
        <Button
          label="Evet, Teslim Aldım"
          onPress={handleConfirm}
          loading={confirming}
          disabled={!allowed}
        />
      </Box>
    </Box>
  );
}