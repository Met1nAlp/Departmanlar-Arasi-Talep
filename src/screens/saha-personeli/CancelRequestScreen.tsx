import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'CancelRequest'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'CancelRequest'>;

// Sabit neden listesi — ileride Efe'nin backend'i bunu bir enum olarak
// tanımlayınca (RequestCancelReason gibi) buradan import edeceğiz.
// Şimdilik ekranı kurabilmek için burada sabit tutuyoruz.
const cancelReasons = [
  'Yanlış ürün seçtim',
  'Artık ihtiyaç yok',
  'Yanlış departmana gönderdim',
  'Diğer',
];

export default function CancelRequestScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();

  // Hangi neden seçili, henüz hiçbiri seçilmemişse null
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  // Kullanıcının serbest metin olarak eklediği ek açıklama
  const [note, setNote] = useState('');
  // Onay ekranının açık/kapalı olması
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [header, setHeader] = useState<{ requestId: string; productName: string } | null>(null);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      const products = await getProductsByIds([req.productId]);
      setHeader({ requestId: req.id, productName: products[0]?.name ?? '' });
    });
  }, [route.params.requestId]);

  const handleCancel = () => {
    // ÖNEMLİ: Şu an types/index.ts içindeki RequestStatus tipinde CANCELLED
    // durumu yok (Efe'nin E1 maddesinde 10 duruma genişletilecek). O yüzden
    // burada gerçek bir API çağrısı YAPMIYORUZ henüz — sadece ekranı ve akışı
    // hazırlıyoruz. Efe'nin tipleri gelince burası updateRequestStatus(id, 'CANCELLED', { reason, note })
    // gibi bir çağrıya dönüşecek.
    console.log('İptal edildi:', { requestId: route.params.requestId, reason: selectedReason, note });
    setConfirmVisible(false);
    navigation.popToTop();
  };

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="white"
        border
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="surface" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Box>
            <Text variant="h2">Talebi İptal Et</Text>
            {header && (
              <Text variant="caption" color="textMuted">
                {header.requestId.toUpperCase()} · {header.productName}
              </Text>
            )}
          </Box>
        </Stack>
      </Box>

      <Box style={{ flex: 1 }} padding="md">
        <Text variant="h2">İptal nedenini seçin</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          Neden, depo ekibinin ekranında görünür.
        </Text>

        <Stack gap="sm">
          {cancelReasons.map((reason) => {
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

        {/* Ek açıklama alanı — zorunlu değil, kullanıcı isterse doldurur */}
        <Box style={{ marginTop: spacing.lg }}>
          <TextField
            label="Not (isteğe bağlı)"
            placeholder="Örn. yağ değişimi bir sonraki vardiyaya alındı..."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </Box>
      </Box>

      {/* Butonlar, bir neden seçilmeden basılamaz — disabled kontrolü bunu sağlıyor */}
      <Box padding="md">
        <Button
          label="Talebi İptal Et"
          onPress={() => setConfirmVisible(true)}
          variant="danger"
          disabled={!selectedReason}
        />
        <Button
          label="Vazgeç"
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />
      </Box>

      {/* Son onay — geri dönüşü olmayan bir işlem olduğu için */}
      <ConfirmSheet
        visible={confirmVisible}
        title="Talebi iptal etmek istediğinize emin misiniz?"
        description="Bu işlem geri alınamaz."
        confirmLabel="Evet, İptal Et"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setConfirmVisible(false)}
      />
    </Box>
  );
}
