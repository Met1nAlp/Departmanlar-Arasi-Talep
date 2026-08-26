// src/screens/saha-personeli/QRScanScreen.tsx
import { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { NumericKeypad } from '../../design-system/components/NumericKeypad';
import { ScanTarget } from '../../design-system/components/ScanTarget';
import { colors, spacing } from '../../design-system/tokens';
import { getProductByQrCode } from '../../api/products';
import { createRequest } from '../../api/requests';
import { useActiveUser } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import { parseGs1Barcode } from '../../domain/barcode/gs1Parser';

const SUPPORTED_BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'code128'] as const;

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'QRScan'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'QRScan'>;

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const insets = useSafeAreaInsets();
  const cart = useCartStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(!!route.params.preselectedProduct);
  const [product, setProduct] = useState<Product | null>(route.params.preselectedProduct ?? null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: scanned });
  }, [navigation, scanned]);

  const [lastScannedCode, setLastScannedCode] = useState('');

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setNotFound(false);

    const gs1 = parseGs1Barcode(data);
    const lookupCode = gs1?.gtin ?? data;

    console.log('[QR OKUNDU] ham veri:', data, '| GS1 çözümlemesi:', gs1, '| aranan kod:', lookupCode);
    setLastScannedCode(lookupCode);

    const result = await getProductByQrCode(lookupCode);
    if (result) setProduct(result);
    else setNotFound(true);
  };

  const handleRescan = () => {
    setScanned(false);
    setProduct(null);
    setNotFound(false);
    setQuantity('');
    setLastScannedCode('');
  };

  /** Mevcut ürünü sepete ekler, tarama adımına geri döner — ARTIK VERİYİ SİLMİYOR. */
  const handleAddAnother = () => {
    if (product && quantity !== '' && Number(quantity) > 0) {
      cart.addLine(product.id, product.name, Number(quantity));
    }
    handleRescan();
  };

  /** Sepetteki + (varsa) mevcut ürünü tek tek, ayrı CREATE_REQUEST olarak gönderir. */
  const handleSubmitAll = async () => {
    if (!user) return;

    const finalLines = [...cart.lines];
    if (product && quantity !== '' && Number(quantity) > 0) {
      finalLines.push({ partId: product.id, partName: product.name, qtyRequested: Number(quantity) });
    }
    if (finalLines.length === 0) return;

    setSubmitting(true);
    const requestIds: string[] = [];
    // Sıralı gönderim — mepsanServerClient FIFO kuyruğuyla çalıştığı için
    // aynı anda çoklu istek yerine sırayla bekleyip göndermek daha güvenli.
    for (const line of finalLines) {
      const newRequest = await createRequest({
        departmentId: route.params.departmentId,
        productId: line.partId,
        quantity: line.qtyRequested,
        requesterId: user.id,
        requesterName: user.name,
        priority: route.params.priority,
      });
      requestIds.push(newRequest.id);
    }
    cart.clear();
    setSubmitting(false);
    navigation.navigate('RequestCreated', { requestIds });
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Box style={{ flex: 1 }} background="white" padding="lg">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" color="textPrimary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            QR/barkod okutmak için kamera izni gerekiyor
          </Text>
          <Button label="İzin Ver" onPress={requestPermission} fullWidth={false} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      </Box>
    );
  }

  if (!scanned) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: [...SUPPORTED_BARCODE_TYPES] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
                <ScanTarget
          title="Parça Etiketini Okut"
          subtitle="Adım 2/2 · Yeni talep"
          onBack={() => navigation.goBack()}
          hint="Karekodu çerçeve içinde tutun"
          onManualEntry={() => navigation.replace('ProductSearch', { departmentId: route.params.departmentId, priority: route.params.priority })}
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn((v) => !v)}
          footerNote="Etiket yıpranmışsa parça numarasını elle girin"
          rightActionLabel={cart.lines.length > 0 ? (submitting ? '...' : `Bitir (${cart.lines.length})`) : undefined}
          onRightAction={cart.lines.length > 0 && !submitting ? handleSubmitAll : undefined}
        />
      </View>
    );
  }

  if (notFound) {
    return (
      <Box style={{ flex: 1 }} background="white" padding="lg">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" color="textPrimary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            Bu koda kayıtlı bir ürün bulunamadı
          </Text>
          <Box background="surface" radius="md" padding="sm" style={{ marginBottom: spacing.md }}>
            <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>
              Okunan kod: {lastScannedCode}
            </Text>
          </Box>
          <Button label="Tekrar Okut" onPress={handleRescan} fullWidth={false} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      </Box>
    );
  }

  const canSubmit = (quantity !== '' && Number(quantity) > 0) || cart.lines.length > 0;

  return (
    <Box style={{ flex: 1 }} background="white">
      <ScrollView contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}>
        <Text variant="h2" style={{ marginBottom: spacing.xs }}>
          {product?.name}
        </Text>
        <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          Adet
        </Text>
        <Text variant="h1" color="blue" style={{ textAlign: 'center', marginBottom: spacing.sm, minHeight: 40 }}>
          {quantity || '0'}
        </Text>
        <NumericKeypad value={quantity} onChange={setQuantity} maxLength={4} />

        {cart.lines.length > 0 && (
          <Box style={{ marginTop: spacing.lg }}>
            <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginBottom: spacing.xs }}>
              SEPETTEKİ ÜRÜNLER ({cart.lines.length})
            </Text>
            <Stack gap="xs">
              {cart.lines.map((line) => (
                <Stack
                  key={line.partId}
                  direction="row"
                  justify="space-between"
                  align="center"
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                  }}
                >
                  <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                    {line.partName} <Text variant="caption" color="textMuted">× {line.qtyRequested}</Text>
                  </Text>
                  <Pressable
                    onPress={() => cart.removeLine(line.partId)}
                    style={{ minWidth: 32, minHeight: 32 }}
                    accessibilityLabel={`${line.partName} sepetten çıkar`}
                  >
                    <Ionicons name="close" size={18} color={colors.danger} />
                  </Pressable>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </ScrollView>
      <Box padding="md" style={{ paddingTop: 0, paddingBottom: insets.bottom + spacing.md }}>
        <Button
          testID="qr-submit-request"
          label={cart.lines.length > 0 ? `Talebi Oluştur (${cart.lines.length + 1} ürün)` : 'Talebi Oluştur'}
          onPress={handleSubmitAll}
          loading={submitting}
          disabled={!canSubmit || submitting}
        />
        <Button
          label="Sepete Ekle, Ürün Daha Ekle"
          onPress={handleAddAnother}
          variant="secondary"
          disabled={quantity === '' || Number(quantity) <= 0 || submitting}
          style={{ marginTop: spacing.sm }}
        />
      </Box>
    </Box>
  );
}