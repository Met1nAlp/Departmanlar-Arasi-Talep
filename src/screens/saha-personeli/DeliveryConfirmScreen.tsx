// src/screens/saha-personeli/DeliveryConfirmScreen.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequestById, updateRequestStatus } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [confirming, setConfirming] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');

  // RBAC savunması: bu ekrana yalnızca RequestTrackingScreen'den, yetkili bir
  // rolle geliniyor olması beklenir. Yine de derin bağlantı/rol değişimi gibi
  // durumlara karşı burada da kontrol edilir (bkz. RequestPolicies.canClose).
  const allowed = user ? canConfirmDelivery(user.role) : false;

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      setRequest(req);
      const products = await getProductsByIds([req.productId]);
      setProductName(products[0]?.name ?? '');
    });
  }, [route.params.requestId]);

  const handleConfirm = async () => {
    if (!allowed) return;
    setConfirming(true);
    await updateRequestStatus(route.params.requestId, 'TESLIM_EDILDI');
    setConfirming(false);
    navigation.popToTop();
  };

  return (
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

        <Box
          background="blueLight"
          style={{ width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="grid-outline" size={32} color={colors.blue} />
        </Box>

        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          Ürünü teslim aldınız mı?
        </Text>
        {request && (
          <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {request.id.toUpperCase()} · {productName} <Text variant="bodyBold">{request.quantity} adet</Text>.{' '}
            Onayladığınızda talep kapanır ve stoktan düşülür.
          </Text>
        )}

        <Stack style={{ width: '100%', marginTop: spacing.lg }}>
          <Button
            label="Evet, Teslim Aldım"
            onPress={handleConfirm}
            loading={confirming}
            disabled={!allowed || !request}
          />
          <Button
            label="Vazgeç"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </Stack>
      </Box>
    </View>
  );
}
