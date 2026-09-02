// src/screens/uretim-yoneticisi/DeliveryConfirmScreen.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
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
import { scale } from '../../design-system/tokens/scale';
import { readCardUid, isNfcSupported, cancelReading } from '../../infrastructure/nfc/NfcReader';
import { cardDetectedFeedback } from '../../design-system/feedback';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'DeliveryConfirm'>;
type Rt = RouteProp<UretimYoneticisiStackParamList, 'DeliveryConfirm'>;

type Step = 'idle' | 'reading' | 'mismatch' | 'unsupported' | 'confirming';

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [step, setStep] = useState<Step>('idle');
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

  useEffect(() => {
    return () => {
      cancelReading();
    };
  }, []);

  const handleStartConfirm = async () => {
    if (!allowed || !request || !user) return;

    const supported = await isNfcSupported();
    if (!supported) {
      setStep('unsupported');
      return;
    }

    setStep('reading');
    try {
      const scannedUid = await readCardUid();
      // Kart algılanır algılanmaz (eşleşme kontrolünden ÖNCE) titreşim + ses —
      // kullanıcı kartı okuyucuya basılı tutmaya devam etmesin.
      void cardDetectedFeedback();
      if (scannedUid !== user.cardUid) {
        setStep('mismatch');
        return;
      }

      setStep('confirming');
      await updateRequestStatus(request, 'TESLIM_EDILDI');
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
    } catch {
      setStep('mismatch');
    }
  };

  const isBusy = step === 'reading' || step === 'confirming';

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
          background={step === 'mismatch' || step === 'unsupported' ? 'dangerLight' : 'blueLight'}
          style={{ width: scale(72), height: scale(72), borderRadius: scale(999), alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons
            name={step === 'reading' ? 'radio-outline' : step === 'mismatch' || step === 'unsupported' ? 'close-circle' : 'grid-outline'}
            size={32}
            color={step === 'mismatch' || step === 'unsupported' ? colors.danger : colors.blue}
          />
        </Box>

        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {step === 'reading' && 'Kartınızı Okutun...'}
          {step === 'confirming' && 'Onaylanıyor...'}
          {step === 'mismatch' && 'Kart Eşleşmedi'}
          {step === 'unsupported' && 'NFC Desteklenmiyor'}
          {(step === 'idle') && 'Ürünü teslim aldınız mı?'}
        </Text>

        {step === 'idle' && request && (
          <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {request.id.toUpperCase()} · {productName} <Text variant="bodyBold">{request.quantity} adet</Text>.{' '}
            Onaylamak için kendi NFC kartınızı okutmanız gerekir.
          </Text>
        )}

        {step === 'mismatch' && (
          <Text variant="body" color="danger" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            Okutulan kart, oturum açan kullanıcıyla eşleşmiyor. Lütfen kendi kartınızı okutun.
          </Text>
        )}

        {step === 'unsupported' && (
          <Text variant="body" color="danger" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            Bu cihaz NFC desteklemiyor, teslim onayı bu cihazdan yapılamıyor.
          </Text>
        )}

        <Stack style={{ width: '100%', marginTop: spacing.lg }}>
          <Button
            label={step === 'mismatch' ? 'Tekrar Dene' : 'Kartımı Okut ve Onayla'}
            onPress={handleStartConfirm}
            loading={isBusy}
            disabled={!allowed || !request || step === 'unsupported'}
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