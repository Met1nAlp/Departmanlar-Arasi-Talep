import { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors } from '../../design-system/tokens';

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

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

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
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        Bu talebi neden karşılayamıyorsunuz?
      </Text>

      <Stack gap="sm">
        {rejectReasons.map((reason) => {
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

      <Box style={{ marginTop: spacing.lg }}>
        <TextField
          label="Ek açıklama (isteğe bağlı)"
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

      <ConfirmSheet
        visible={confirmVisible}
        title="Talebi reddetmek istediğinize emin misiniz?"
        description="Talep eden kişiye red bildirimi gönderilecek."
        confirmLabel="Evet, Reddet"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setConfirmVisible(false)}
      />
    </Box>
  );
}