// src/screens/saha-personeli/QRScanScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { getProductByQrCode } from '../../api/products';
import { createRequest } from '../../api/requests';
import { useAuthStore } from '../../store/authStore';
import { Product } from '../../types';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'QRScan'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'QRScan'>;

// Sadece kendi ürettiğimiz QR değil, ürün üzerindeki fabrika barkodlarını da (EAN/UPC/Code128) okuyabilelim
const SUPPORTED_BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'code128'] as const;

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setNotFound(false);

    const result = await getProductByQrCode(data);
    if (result) {
      setProduct(result);
    } else {
      setNotFound(true);
    }
  };

  const handleRescan = () => {
    setScanned(false);
    setProduct(null);
    setNotFound(false);
  };

  const handleSubmit = async () => {
    if (!product || !user) return;
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

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[typography.body, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md }]}>
          QR/barkod okutmak için kamera izni gerekiyor
        </Text>
        <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sonuç ekranı (taramadan sonra) — kamera olmadığı için burada overflow/rounded kullanmak güvenli
  if (scanned) {
    return (
      <View style={styles.container}>
        <View style={[styles.cameraWrapper, styles.resultOverlay]}>
          {notFound ? (
            <>
              <Text style={[typography.body, { color: colors.white, textAlign: 'center' }]}>
                Bu koda kayıtlı bir ürün bulunamadı
              </Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleRescan}>
                <Text style={{ color: colors.white, fontWeight: '600' }}>Tekrar Okut</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[typography.body, { color: colors.white, textAlign: 'center' }]}>
              Okunan ürün: {product?.name}
            </Text>
          )}
        </View>

        {product && !notFound && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Adet</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.white} /> : (
                <Text style={{ color: colors.white, fontWeight: '600' }}>Talebi Oluştur</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRescan} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.blue }]}>Farklı bir ürün okut</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Tarama ekranı — köşesiz, tam ekran (overflow/borderRadius YOK — siyah ekran sorununu önlemek için)
  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: [...SUPPORTED_BARCODE_TYPES] }}
      onBarcodeScanned={handleBarcodeScanned}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.md },
  centered: { justifyContent: 'center', alignItems: 'center' },
  cameraWrapper: {
    height: 300,
    borderRadius: radius.md,
    overflow: 'hidden', // burada sorun yok çünkü artık canlı kamera değil, sadece sonuç metni gösteriyor
    backgroundColor: colors.black,
  },
  resultOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  scanButton: {
    marginTop: spacing.md,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: 16, color: colors.textPrimary,
  },
  submitButton: {
    marginTop: spacing.md, backgroundColor: colors.blue, padding: spacing.md,
    borderRadius: radius.md, alignItems: 'center',
  },
});