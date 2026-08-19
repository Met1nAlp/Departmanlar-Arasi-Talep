import { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors } from '../../design-system/tokens';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'CancelRequest'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'CancelRequest'>;

// Sabit neden listesi — ileride Efe'nin backend'i bunu bir enum olarak
// tanımlayınca (RequestCancelReason gibi) buradan import edeceğiz.
// Şimdilik ekranı kurabilmek için burada sabit tutuyoruz.
const cancelReasons = [
  'Yanlış ürün seçildi',
  'Artık ihtiyaç yok',
  'Yanlış departman seçildi',
  'Diğer',
];

export default function CancelRequestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  // Hangi neden seçili, henüz hiçbiri seçilmemişse null
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  // Kullanıcının serbest metin olarak eklediği ek açıklama
  const [note, setNote] = useState('');
  // Onay ekranının açık/kapalı olması
  const [confirmVisible, setConfirmVisible] = useState(false);

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
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        İptal nedeni seçin
      </Text>

      {/* Neden listesi — her satır bir Pressable, seçili olan mavi kenarlıkla vurgulanıyor.
          Bu, PrioritySelectScreen'de kullandığımız aynı "tek seçimli liste" kalıbı. */}
      <Stack gap="sm">
        {cancelReasons.map((reason) => {
          const isSelected = selectedReason === reason;
          return (
            <Pressable
              key={reason}
              onPress={() => setSelectedReason(reason)}
              background="surface"
              radius="md"
              style={{
                width: '100%',
                paddingHorizontal: spacing.md,
                justifyContent: 'flex-start',
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.blue,
              }}
            >
              <Text variant="body">{reason}</Text>
            </Pressable>
          );
        })}
      </Stack>

      {/* Ek açıklama alanı — zorunlu değil, kullanıcı isterse doldurur */}
      <Box style={{ marginTop: spacing.lg }}>
        <TextField
          label="Ek açıklama (isteğe bağlı)"
          placeholder="Detay ekleyin..."
          value={note}
          onChangeText={setNote}
          multiline
        />
      </Box>

      {/* Buton, bir neden seçilmeden basılamaz — disabled kontrolü bunu sağlıyor */}
      <Box style={{ marginTop: spacing.xl }}>
        <Button
          label="Talebi İptal Et"
          onPress={() => setConfirmVisible(true)}
          variant="danger"
          disabled={!selectedReason}
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