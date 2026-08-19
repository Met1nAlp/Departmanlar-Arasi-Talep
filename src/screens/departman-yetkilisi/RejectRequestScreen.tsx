import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { spacing, colors, radius } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'RejectRequest'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'RejectRequest'>;

// Tedarikçi tarafına özgü red nedenleri — CancelRequestScreen'deki
// "Saha Personeli" nedenlerinden kasıtlı olarak farklı bir liste.
// Efe'nin backend'i bunu enum olarak tanımlayınca (RequestRejectReason)
// buradan import edeceğiz, şimdilik sabit tutuyoruz.
const rejectReasons = [
  'Stokta yok',
  'Kapasite dolu, yetişemiyorum',
  'Ürün bilgisi hatalı/eksik',
  'Diğer',
];

export default function RejectRequestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [summary, setSummary] = useState<{ requestId: string; productName: string; quantity: number } | null>(null);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      const [product] = await getProductsByIds([req.productId]);
      setSummary({ requestId: req.id, productName: product?.name ?? '', quantity: req.quantity });
    });
  }, [route.params.requestId]);

  const handleReject = () => {
    // ÖNEMLİ: CancelRequestScreen'de olduğu gibi, RequestStatus tipinde
    // henüz REJECTED durumu yok (Efe'nin E1 maddesi). Gerçek API çağrısı
    // yerine şimdilik sadece konsola yazıyoruz — Efe'nin tipleri gelince
    // updateRequestStatus(id, 'REJECTED', { reason, note }) olacak.
    console.log('Reddedildi:', { requestId: route.params.requestId, reason: selectedReason, note });
    setConfirmVisible(false);
    navigation.goBack();
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="h2">Bu talebi neden karşılayamıyorsunuz?</Text>
      <Text variant="body" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
        Neden, talep eden kişinin ekranında görünür.
      </Text>

      <Stack gap="sm">
        {rejectReasons.map((reason) => {
          const isSelected = selectedReason === reason;
          return (
            <Pressable
              key={reason}
              onPress={() => setSelectedReason(reason)}
              background="white"
              radius="md"
              style={{
                width: '100%',
                paddingHorizontal: spacing.md,
                justifyContent: 'flex-start',
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.blue : colors.border,
              }}
            >
              <Stack direction="row" align="center" gap="md">
                <Box
                  background={isSelected ? 'blue' : 'white'}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 0 : 1.5,
                    borderColor: colors.border,
                  }}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color={colors.white} />}
                </Box>
                <Text variant="body">{reason}</Text>
              </Stack>
            </Pressable>
          );
        })}
      </Stack>

      <Box style={{ marginTop: spacing.lg }}>
        <TextField
          label="Not (isteğe bağlı)"
          placeholder="Detay ekleyin..."
          value={note}
          onChangeText={setNote}
          multiline
        />
      </Box>

      <Box style={{ marginTop: spacing.xl }}>
        <Button
          label="Talebi Reddet"
          onPress={() => setConfirmVisible(true)}
          variant="danger"
          disabled={!selectedReason}
        />
      </Box>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
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
              background="dangerLight"
              style={{ width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="warning" size={32} color={colors.danger} />
            </Box>

            <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              Talep reddedilsin mi?
            </Text>
            {summary && (
              <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                {summary.requestId.toUpperCase()} · {summary.productName}{' '}
                <Text variant="bodyBold">({summary.quantity} adet)</Text> reddedilecek. Talep eden bilgilendirilir ve
                hat yöneticisine eskalasyon açılır.
              </Text>
            )}

            <Box
              background="dangerLight"
              radius="md"
              padding="sm"
              style={{ width: '100%', marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text variant="caption" color="danger" style={{ marginLeft: spacing.xs, flex: 1 }}>
                Bu işlem geri alınamaz.
              </Text>
            </Box>

            <Stack style={{ width: '100%', marginTop: spacing.lg }}>
              <Button label="Evet, Reddet" onPress={handleReject} variant="danger" />
              <Button
                label="Vazgeç"
                onPress={() => setConfirmVisible(false)}
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
