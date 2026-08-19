import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { MaterialRequest, RequestLine } from '../../contracts/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing, colors } from '../../design-system/tokens';
import { getMaterialRequestById, submitPreparation } from '../../api/materialRequests';
import { mockProducts } from '../../mocks/products';
import { useContainerSelectionStore } from '../../store/containerSelectionStore';
import { useSerialCaptureStore } from '../../store/serialCaptureStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'PartialFulfillment'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'PartialFulfillment'>;

// Sepet ekranında parti/ürün id'leri mockProducts'tan geldiği için, isim
// çözümlemesini de aynı kaynaktan yapıyoruz (Efe'nin gerçek Part kataloğu
// gelene kadar geçici köprü).
function getPartName(partId: string): string {
  return mockProducts.find((p) => p.id === partId)?.name ?? partId;
}

export default function PartialFulfillmentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const containerTypeId = useContainerSelectionStore((s) => s.selections[route.params.requestId]);
  const serialsByLine = useSerialCaptureStore((s) => s.serialsByLine);
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [preparedQty, setPreparedQty] = useState<Record<string, string>>({});
  const [shortageReasons, setShortageReasons] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    getMaterialRequestById(route.params.requestId).then((req) => {
      if (!req) return;
      setRequest(req);
      // Başlangıç değeri: istenen adet kadar (çoğu zaman tam karşılanır varsayımı,
      // kullanıcı eksikse elle düşürür)
      const initial: Record<string, string> = {};
      req.lines.forEach((line) => {
        initial[line.id] = String(line.qtyPrepared ?? line.qtyRequested);
      });
      setPreparedQty(initial);
    });
  }, [route.params.requestId]);

  if (!request) return <LoadingView />;

  const hasShortage = request.lines.some((line) => {
    const qty = Number(preparedQty[line.id] ?? 0);
    return qty < line.qtyRequested;
  });

  const handleSubmit = async () => {
    if (!request) return;
    setSubmitting(true);
    await submitPreparation(
      request.id,
      request.lines.map((line) => ({
        lineId: line.id,
        qtyPrepared: Number(preparedQty[line.id] ?? 0),
        shortageReason:
          Number(preparedQty[line.id] ?? 0) < line.qtyRequested ? shortageReasons[line.id] : undefined,
        serials: serialsByLine[line.id],
      })),
      containerTypeId
    );
    setSubmitting(false);
    setConfirmVisible(false);
    navigation.goBack();
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="h2">{request.requestNo}</Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
        Her kalem için hazırlayabildiğiniz adedi girin
      </Text>

      {request.lines.map((line: RequestLine) => {
        const qty = Number(preparedQty[line.id] ?? 0);
        const isShort = qty < line.qtyRequested;

        return (
          <Box key={line.id} padding="md" background="surface" radius="md" style={{ marginBottom: spacing.sm }}>
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="bodyBold" style={{ flex: 1 }}>
                {getPartName(line.partId)}
              </Text>
              <Text variant="caption" color="textMuted">
                İstenen: {line.qtyRequested}
              </Text>
            </Stack>

            <Stack direction="row" align="center" gap="sm" style={{ marginTop: spacing.sm }}>
              <Pressable
                onPress={() =>
                  setPreparedQty((prev) => ({
                    ...prev,
                    [line.id]: String(Math.max(0, qty - 1)),
                  }))
                }
                background="surface"
                radius="sm"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
              >
                <Text variant="body">−</Text>
              </Pressable>
              <Text variant="bodyBold" color={isShort ? 'danger' : 'textPrimary'}>
                {qty}
              </Text>
              <Pressable
                onPress={() =>
                  setPreparedQty((prev) => ({
                    ...prev,
                    [line.id]: String(Math.min(line.qtyRequested, qty + 1)),
                  }))
                }
                background="surface"
                radius="sm"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
              >
                <Text variant="body">+</Text>
              </Pressable>
            </Stack>

                        {isShort && (
              <View style={{ marginTop: spacing.sm }}>
                <TextField
                  placeholder="Eksik olma nedeni (örn. stokta yok)"
                  value={shortageReasons[line.id] ?? ''}
                  onChangeText={(text) =>
                    setShortageReasons((prev) => ({ ...prev, [line.id]: text }))
                  }
                />
              </View>
            )}

            {/* NOT: serialTracked bilgisi henüz mock katalogda yok (Efe'nin Part
                tipi gelince otomatik gösterilecek) — şimdilik her kalemde opsiyonel */}
            <Pressable
              onPress={() => navigation.navigate('SerialCapture', { lineId: line.id, qty })}
              style={{ marginTop: spacing.sm, minHeight: undefined, alignItems: 'flex-start' }}
            >
              <Text variant="caption" color="blue">
                {(serialsByLine[line.id]?.length ?? 0) > 0
                  ? `Seri No: ${serialsByLine[line.id].length} girildi`
                  : 'Seri No Gir (opsiyonel)'}
              </Text>
            </Pressable>
          </Box>
        );
      })}

        <Pressable
        onPress={() => navigation.navigate('ContainerSelect', { requestId: request.id })}
        background="surface"
        radius="md"
        style={{ width: '100%', marginTop: spacing.md, paddingHorizontal: spacing.md, justifyContent: 'flex-start' }}
      >
        <Text variant="body">
          {containerTypeId ? `Kap: ${containerTypeId}` : 'Kap/Taşıma Birimi Seç (opsiyonel)'}
        </Text>
      </Pressable>

      <Box style={{ marginTop: spacing.lg }}>
        <Button
          label={hasShortage ? 'Kısmi Olarak Tamamla' : 'Hazırlamayı Tamamla'}
          onPress={() => setConfirmVisible(true)}
          variant={hasShortage ? 'secondary' : 'primary'}
        />
      </Box>

      <ConfirmSheet
        visible={confirmVisible}
        title={hasShortage ? 'Kısmi karşılama onayı' : 'Hazırlama tamamlandı mı?'}
        description={
          hasShortage
            ? 'Bazı kalemler eksik hazırlandı. Talep eden kişiye kısmi teslimat bildirimi gönderilecek.'
            : 'Talep artık teslim alınmaya hazır olarak işaretlenecek.'
        }
        confirmLabel="Onayla"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmVisible(false)}
      />
    </Box>
  );
}