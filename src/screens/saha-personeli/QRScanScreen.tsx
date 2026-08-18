// src/screens/saha-personeli/QRScanScreen.tsx
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { NumericKeypad } from '../../design-system/components/NumericKeypad';
import { ScanTarget } from '../../design-system/components/ScanTarget';
import { spacing } from '../../design-system/tokens';
import { getProductByQrCode } from '../../api/products';
import { createRequest } from '../../api/requests';
import { useActiveUser } from '../../store/authStore';
import { Product } from '../../types';
import { parseGs1Barcode } from '../../domain/barcode/gs1Parser';

const SUPPORTED_BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'code128'] as const;

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'QRScan'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'QRScan'>;

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();

  const [permission, requestPermission] = useCameraPermissions();
  // Eğer ProductSearchScreen'den bir ürünle geldiysek, "scanned" durumundan başlıyoruz —
  // kamera adımı tamamen atlanıyor.
  const [scanned, setScanned] = useState(!!route.params.preselectedProduct);
  const [product, setProduct] = useState<Product | null>(route.params.preselectedProduct ?? null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setNotFound(false);

    // Plan Bölüm 13.3: tedarikçi barkodu GS1-128/DataMatrix olabilir (AI
    // önekli, örn. "0112345678901231..."). Bu durumda ürünü GTIN ile arıyoruz;
    // değilse (kendi ürettiğimiz düz QR veya fabrika EAN/UPC) ham veriyle
    // aranan eski davranışa düşüyoruz. NOT: legacy mockProducts'ta henüz gtin
    // alanı yok — backend/contracts entegrasyonunda PART_BARCODE.parsed_gtin
    // üzerinden gerçek eşleme yapılacak (bkz. legacyAdapter.ts deseni).
    const gs1 = parseGs1Barcode(data);
    const lookupCode = gs1?.gtin ?? data;

    const result = await getProductByQrCode(lookupCode);
    if (result) setProduct(result);
    else setNotFound(true);
  };

  const handleRescan = () => {
    setScanned(false);
    setProduct(null);
    setNotFound(false);
    setQuantity('');
  };

  const handleSubmit = async () => {
    if (!product || !user || quantity === '' || Number(quantity) <= 0) return;
    setSubmitting(true);
    const newRequest = await createRequest({
      departmentId: route.params.departmentId,
      productId: product.id,
      quantity: Number(quantity),
      requesterId: user.id,
    });
    setSubmitting(false);
    navigation.navigate('RequestCreated', { requestId: newRequest.id });
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
          barcodeScannerSettings={{ barcodeTypes: [...SUPPORTED_BARCODE_TYPES] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <ScanTarget instruction="Ürünün kodunu kadraja alın" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      {notFound ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" color="textPrimary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            Bu koda kayıtlı bir ürün bulunamadı
          </Text>
          <Button label="Tekrar Okut" onPress={handleRescan} fullWidth={false} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      ) : (
        <>
          <Text variant="h2" style={{ marginBottom: spacing.xs }}>
            {product?.name}
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.lg }}>
            Adet
          </Text>
          <Text variant="h1" color="blue" style={{ textAlign: 'center', marginBottom: spacing.lg, minHeight: 40 }}>
            {quantity || '0'}
          </Text>
          <NumericKeypad value={quantity} onChange={setQuantity} maxLength={4} />
          <Box style={{ marginTop: spacing.lg }}>
            <Button
              testID="qr-submit-request"
              label="Talebi Oluştur"
              onPress={handleSubmit}
              loading={submitting}
              disabled={quantity === '' || Number(quantity) <= 0}
            />
            <Button
              label={route.params.preselectedProduct ? 'Farklı Ürün Seç' : 'Farklı Ürün Okut'}
              onPress={route.params.preselectedProduct ? () => navigation.goBack() : handleRescan}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          </Box>
        </>
      )}
    </Box>
  );
}