import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import { spacing, colors, radius } from '../../design-system/tokens';
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
  const insets = useSafeAreaInsets();
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

  const shortLines = request.lines.filter((line) => Number(preparedQty[line.id] ?? 0) < line.qtyRequested);
  const hasShortage = shortLines.length > 0;
  const fullCount = request.lines.length - shortLines.length;

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
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {request.requestNo} · {request.lines.length} KALEM
            </Text>
            <Text variant="h1" color="white">
              Kısmi Karşılama
            </Text>
          </Box>
        </Stack>
        <Text variant="body" color="white" style={{ opacity: 0.85, marginTop: spacing.xs }}>
          {fullCount} kalem tam · {shortLines.length} kalem eksik
        </Text>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {request.lines.map((line: RequestLine) => {
          const qty = Number(preparedQty[line.id] ?? 0);
          const isShort = qty < line.qtyRequested;

          return (
            <Box
              key={line.id}
              padding="md"
              background="surface"
              radius="md"
              style={{
                marginBottom: spacing.sm,
                borderLeftWidth: isShort ? 4 : 0,
                borderLeftColor: colors.danger,
              }}
            >
              <Stack direction="row" justify="space-between" align="center">
                <Text variant="bodyBold" style={{ flex: 1 }}>
                  {getPartName(line.partId)}
                </Text>
                <LineStatusChip isShort={isShort} />
              </Stack>

              <Stack direction="row" align="center" style={{ marginTop: spacing.md }}>
                <Box style={{ flex: 1 }}>
                  <Text variant="caption" color="textMuted">
                    İstenen
                  </Text>
                  <Text variant="h2">{line.qtyRequested}</Text>
                </Box>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                <Box style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text variant="caption" color="textMuted">
                    Hazırlanan
                  </Text>
                  <Stack direction="row" align="center" gap="sm">
                    <Pressable
                      onPress={() =>
                        setPreparedQty((prev) => ({ ...prev, [line.id]: String(Math.max(0, qty - 1)) }))
                      }
                      background="white"
                      radius="sm"
                      style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text variant="body">−</Text>
                    </Pressable>
                    <Text variant="h2" color={isShort ? 'danger' : 'blue'}>
                      {qty}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setPreparedQty((prev) => ({
                          ...prev,
                          [line.id]: String(Math.min(line.qtyRequested, qty + 1)),
                        }))
                      }
                      background="white"
                      radius="sm"
                      style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text variant="body">+</Text>
                    </Pressable>
                  </Stack>
                </Box>
              </Stack>

              {isShort && (
                <View style={{ marginTop: spacing.md }}>
                  <Text variant="caption" color="danger" style={{ letterSpacing: 1, marginBottom: spacing.xs }}>
                    EKSİK NEDENİ
                  </Text>
                  <TextField
                    placeholder="Örn. rafta 1 adet kaldı, kalanı ikinci depoda"
                    value={shortageReasons[line.id] ?? ''}
                    onChangeText={(text) => setShortageReasons((prev) => ({ ...prev, [line.id]: text }))}
                  />
                </View>
              )}

              {/* NOT: serialTracked bilgisi henüz mock katalogda yok (Efe'nin Part
                  tipi gelince otomatik gösterilecek) — şimdilik her kalemde opsiyonel */}
              <Pressable
                onPress={() =>
                  navigation.navigate('SerialCapture', {
                    lineId: line.id,
                    qty,
                    requestNo: request.requestNo,
                    productName: getPartName(line.partId),
                  })
                }
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
          style={{ width: '100%', marginTop: spacing.xs, paddingHorizontal: spacing.md, justifyContent: 'flex-start' }}
        >
          <Stack direction="row" align="center" justify="space-between" style={{ width: '100%' }}>
            <Text variant="body">
              {containerTypeId ? `Kap: ${containerTypeId}` : 'Kap/Taşıma Birimi Seç (opsiyonel)'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Stack>
        </Pressable>

        {hasShortage && (
          <Box
            background="warningLight"
            radius="md"
            padding="md"
            style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text variant="caption" color="warning" style={{ marginLeft: spacing.sm, flex: 1 }}>
              Eksik kalemler için otomatik takip talebi açılır.
            </Text>
          </Box>
        )}
      </ScrollView>

      <Box padding="md" style={{ paddingTop: 0 }}>
        <Button
          label={hasShortage ? 'Kısmi Olarak Gönder' : 'Hazırlamayı Tamamla'}
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

function LineStatusChip({ isShort }: { isShort: boolean }) {
  return (
    <Box
      background={isShort ? 'dangerLight' : 'blueLight'}
      radius="sm"
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3 }}
    >
      <Ionicons
        name={isShort ? 'warning-outline' : 'checkmark'}
        size={12}
        color={isShort ? colors.danger : colors.blue}
      />
      <Text variant="caption" color={isShort ? 'danger' : 'blue'} style={{ marginLeft: 4, fontWeight: '700' }}>
        {isShort ? 'Eksik' : 'Tam'}
      </Text>
    </Box>
  );
}
