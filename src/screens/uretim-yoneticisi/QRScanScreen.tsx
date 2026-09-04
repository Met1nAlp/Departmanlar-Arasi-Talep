// src/screens/uretim-yoneticisi/QRScanScreen.tsx
import { useEffect, useState } from 'react';
import { View, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { NumericKeypad } from '../../design-system/components/NumericKeypad';
import { ScanTarget } from '../../design-system/components/ScanTarget';
import { CartGroupList } from '../../design-system/components/CartGroupList';
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { getProductByQrCode } from '../../api/products';
import { createOrder } from '../../api/requests';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';
import { useCartStore, type CartLine } from '../../store/cartStore';
import { Product } from '../../types';
import { parseGs1Barcode } from '../../domain/barcode/gs1Parser';

const SUPPORTED_BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'code128'] as const;
const DEFAULT_PRIORITY = 'NORMAL' as const;

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'QRScan'>;
type Rt = RouteProp<UretimYoneticisiStackParamList, 'QRScan'>;

function ScreenHeader({ title, onBack, danger = false }: { title: string; onBack: () => void; danger?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Box
      background={danger ? 'dangerLight' : 'blue'}
      style={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
      }}
    >
      <Stack direction="row" align="center" gap="md">
        <Pressable
          onPress={onBack}
          background={danger ? 'white' : 'blueMedium'}
          radius="md"
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={20} color={danger ? colors.textPrimary : colors.white} />
        </Pressable>
        <Text variant="h2" color={danger ? 'textPrimary' : 'white'} numberOfLines={1} style={{ flexShrink: 1 }}>
          {title}
        </Text>
      </Stack>
    </Box>
  );
}

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const insets = useSafeAreaInsets();
  const cart = useCartStore();

  const { departmentId, departmentName } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(!!route.params?.preselectedProduct);
  const [product, setProduct] = useState<Product | null>(route.params?.preselectedProduct ?? null);
  const [notFound, setNotFound] = useState(false);
  const [mismatchDept, setMismatchDept] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [cartModalVisible, setCartModalVisible] = useState(false);

  useEffect(() => {
    getDepartments()
      .then((departments) => {
        setDepartmentNames(Object.fromEntries(departments.map((d) => [d.id, d.name])));
      })
      .catch(() => {});
  }, []);

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  };

  const cartGroups: [string, CartLine[]][] = [];
  for (const line of cart.lines) {
    const existingGroup = cartGroups.find(([departmentId]) => departmentId === line.departmentId);
    if (existingGroup) existingGroup[1].push(line);
    else cartGroups.push([line.departmentId, [line]]);
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setNotFound(false);
    setMismatchDept(null);

    const gs1 = parseGs1Barcode(data);
    const lookupCode = gs1?.gtin ?? data;
    setLastScannedCode(lookupCode);

    const result = await getProductByQrCode(lookupCode);
    if (!result) {
      setNotFound(true);
      return;
    }
    // Kısıtlayıcı mod: departman seçim ekranında seçilen departmana ait
    // olmayan bir ürün okutulursa reddedilir (bkz. DepartmentSelectScreen
    // dosya başı notu).
    if (result.departmentId && result.departmentId !== departmentId) {
      setMismatchDept(departmentNames[result.departmentId] ?? result.departmentId);
      return;
    }
    setProduct(result);
  };

  const handleRescan = () => {
    setScanned(false);
    setProduct(null);
    setNotFound(false);
    setMismatchDept(null);
    setQuantity('');
    setLastScannedCode('');
  };

  const handleAddAnother = () => {
    if (product && quantity !== '' && Number(quantity) > 0) {
      // Ürünün kendi departmentId'si güvenilmez olabilir (PROCESS_QR bazen
      // vermiyor) — burada zaten eşleştiği doğrulanmış tek departman var,
      // onu kullanıyoruz.
      cart.addLine(product.id, product.name, departmentId, Number(quantity));
    }
    handleRescan();
  };

  const handleSubmitAll = async () => {
    if (!user) return;

    const finalLines = [...cart.lines];
    if (product && quantity !== '' && Number(quantity) > 0) {
      finalLines.push({
        partId: product.id,
        partName: product.name,
        departmentId,
        qtyRequested: Number(quantity),
      });
    }
    if (finalLines.length === 0) return;

    setSubmitting(true);

    // Departman seçim ekranında seçilmiş TEK departman var — sepetteki tüm
    // eşyalar zaten ona ait (okutma/aramada kısıtlanıyor), tek sipariş yeterli.
    const createdRequests = await createOrder({
      departmentId,
      items: finalLines.map((line) => ({ productId: line.partId, quantity: line.qtyRequested })),
      requesterId: user.id,
      requesterName: user.name,
      priority: DEFAULT_PRIORITY,
    });
    const requestIds = createdRequests.map((r) => r.id);
    const groups = [
      {
        departmentId,
        items: finalLines.map((line) => ({ partId: line.partId, partName: line.partName, qty: line.qtyRequested })),
      },
    ];

    cart.clear();
    setSubmitting(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Home' }, { name: 'RequestCreated', params: { requestIds, groups } }],
      })
    );
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <ScreenHeader title="Kamera İzni" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="camera-outline" size={scale(48)} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
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
          subtitle={`Yeni talep · ${departmentName}`}
          onBack={() => navigation.goBack()}
          hint="Karekodu çerçeve içinde tutun"
          onManualEntry={() => navigation.replace('ProductSearch', { departmentId, departmentName })}
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn((v) => !v)}
          footerNote="Etiket yıpranmışsa parça numarasını elle girin"
          rightActionLabel={cart.lines.length > 0 ? `Sepet (${cart.lines.length})` : undefined}
          onRightAction={cart.lines.length > 0 ? () => setCartModalVisible(true) : undefined}
        />

        <Modal
          visible={cartModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCartModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <Box
              background="white"
              style={{
                maxHeight: '80%',
                padding: spacing.lg,
                paddingBottom: insets.bottom + spacing.lg,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
              }}
            >
              <Stack direction="row" justify="space-between" align="center" style={{ marginBottom: spacing.md }}>
                <Text variant="h2">Sepetiniz</Text>
                <Pressable
                  onPress={() => setCartModalVisible(false)}
                  background="surface"
                  radius="md"
                  style={{ width: scale(36), height: scale(36), minWidth: scale(36), minHeight: scale(36) }}
                  accessibilityLabel="Kapat"
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </Pressable>
              </Stack>

              <ScrollView style={{ maxHeight: '70%' }}>
                <CartGroupList
                  cartGroups={cartGroups}
                  departmentNames={departmentNames}
                  expandedDepartments={expandedDepartments}
                  onToggleDepartment={toggleDepartment}
                  onRemoveLine={cart.removeLine}
                />
              </ScrollView>

              <Button
                testID="cart-modal-submit"
                label={`Talebi Oluştur (${cart.lines.length} ürün)`}
                onPress={() => {
                  setCartModalVisible(false);
                  void handleSubmitAll();
                }}
                loading={submitting}
                disabled={submitting || cart.lines.length === 0}
                style={{ marginTop: spacing.md }}
              />
              <Button
                label="Taramaya Devam Et"
                onPress={() => setCartModalVisible(false)}
                variant="secondary"
                disabled={submitting}
                style={{ marginTop: spacing.sm }}
              />
            </Box>
          </View>
        </Modal>
      </View>
    );
  }

  if (notFound) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <ScreenHeader title="Ürün Bulunamadı" onBack={() => navigation.goBack()} danger />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="alert-circle-outline" size={scale(48)} color={colors.danger} style={{ marginBottom: spacing.md }} />
          <Text variant="body" color="textPrimary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            Bu koda kayıtlı bir ürün bulunamadı
          </Text>
          <Box background="surface" radius="md" padding="sm" style={{ marginBottom: spacing.md }}>
            <Text variant="mono" color="textMuted" style={{ textAlign: 'center' }}>
              {lastScannedCode}
            </Text>
          </Box>
          <Button label="Tekrar Okut" onPress={handleRescan} fullWidth={false} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      </Box>
    );
  }

  if (mismatchDept) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <ScreenHeader title="Departman Uyuşmuyor" onBack={() => navigation.goBack()} danger />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="alert-circle-outline" size={scale(48)} color={colors.danger} style={{ marginBottom: spacing.md }} />
          <Text variant="body" color="textPrimary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            Bu ürün "{departmentName}" departmanına değil, "{mismatchDept}" departmanına ait. Bu talep akışında sadece {departmentName} ürünleri okutulabilir.
          </Text>
          <Button label="Tekrar Okut" onPress={handleRescan} fullWidth={false} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      </Box>
    );
  }

  const canSubmit = (quantity !== '' && Number(quantity) > 0) || cart.lines.length > 0;

  return (
    <Box style={{ flex: 1 }} background="white">
      <ScreenHeader title="Adet Girin" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Box background="surface" radius="md" padding="sm" style={{ alignItems: 'center', marginBottom: spacing.md }}>
          <Text variant="caption" color="textMuted" numberOfLines={1} style={{ letterSpacing: 1, marginBottom: 2 }}>
            ÜRÜN
          </Text>
          <Text variant="bodyBold" numberOfLines={2} style={{ textAlign: 'center' }}>
            {product?.name}
          </Text>
        </Box>

        <Box
          background="blueLight"
          radius="md"
          style={{ alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md }}
        >
          <Text variant="h1" color="blue" style={{ fontSize: scale(44), minHeight: scale(50) }}>
            {quantity || '0'}
          </Text>
          <Text variant="caption" color="blue" style={{ opacity: 0.7, marginTop: -4 }}>
            adet
          </Text>
        </Box>

        <NumericKeypad value={quantity} onChange={setQuantity} maxLength={4} />

        {cart.lines.length > 0 && (
          <Box style={{ marginTop: spacing.md }}>
            <Stack direction="row" justify="space-between" align="center" style={{ marginBottom: spacing.xs }}>
              <Text variant="caption" color="textMuted" style={{ letterSpacing: 1 }}>
                SEPET
              </Text>
              <Text variant="caption" color="textMuted">
                {cart.lines.length} ürün · {cartGroups.length} departman
              </Text>
            </Stack>
            <CartGroupList
              cartGroups={cartGroups}
              departmentNames={departmentNames}
              expandedDepartments={expandedDepartments}
              onToggleDepartment={toggleDepartment}
              onRemoveLine={cart.removeLine}
            />
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