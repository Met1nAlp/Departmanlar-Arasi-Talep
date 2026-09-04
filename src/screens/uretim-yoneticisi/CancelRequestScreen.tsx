import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { getRequestById, cancelRequest } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { warningFeedback } from '../../design-system/feedback';
import { Request } from '../../types';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'CancelRequest'>;
type Rt = RouteProp<UretimYoneticisiStackParamList, 'CancelRequest'>;

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

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [header, setHeader] = useState<{ requestId: string; productName: string } | null>(null);
  const [request, setRequest] = useState<Request | null>(null);

useEffect(() => {
  getRequestById(route.params.requestId).then(async (req) => {
    if (!req) return;
    setRequest(req);
    const products = await getProductsByIds([req.productId]);
    setHeader({ requestId: req.id, productName: products[0]?.name ?? '' });
  });
}, [route.params.requestId]);

const handleCancel = async () => {
  if (!request || !selectedReason) return;
  const reason = note.trim() ? `${selectedReason} — ${note.trim()}` : selectedReason;
  await cancelRequest(request, reason);
  void warningFeedback();
  setConfirmVisible(false);
  navigation.popToTop();
};

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="danger"
        style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
      >
        <Stack direction="row" align="center" gap="sm">
          <Pressable
            onPress={() => navigation.goBack()}
            background="dangerLight"
            radius="md"
            style={{ width: scale(44), height: scale(44), minWidth: scale(44), minHeight: scale(44) }}
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.danger} />
          </Pressable>
          <Box>
            <Text variant="caption" color="white" style={{ opacity: 0.8, letterSpacing: 1 }}>
              {header ? `${header.requestId.toUpperCase()}` : ''}
            </Text>
            <Text variant="h2" color="white">
              {header?.productName ?? 'Talebi İptal Et'}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Box style={{ flex: 1 }} padding="md">
        <Text variant="bodyBold">İptal nedenini seçin</Text>
        <Text variant="caption" color="textMuted" style={{ marginTop: 2, marginBottom: spacing.sm }}>
          Neden, depo ekibinin ekranında görünür.
        </Text>

        <Stack gap="xs">
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
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  minHeight: scale(44),
                  justifyContent: 'center',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.danger : colors.border,
                }}
              >
                <Stack direction="row" align="center" gap="sm">
                  <Box
                    background={isSelected ? 'danger' : 'white'}
                    style={{
                      width: scale(18),
                      height: scale(18),
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: colors.border,
                    }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={11} color={colors.white} />}
                  </Box>
                  <Text variant="body">{reason}</Text>
                </Stack>
              </Pressable>
            );
          })}
        </Stack>

        <Box style={{ marginTop: spacing.md }}>
          <TextField
            label="Not (isteğe bağlı)"
            placeholder="Örn. yağ değişimi bir sonraki vardiyaya alındı..."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </Box>
      </Box>

      <Box padding="md" style={{ paddingBottom: insets.bottom + spacing.md }}>
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