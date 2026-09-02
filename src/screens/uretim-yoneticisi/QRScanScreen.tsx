// src/screens/uretim-yoneticisi/QRScanScreen.tsx
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
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

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(!!route.params?.preselectedProduct);
  const [product, setProduct] = useState<Product | null>(route.params?.preselectedProduct ?? null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

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

    const gs1 = parseGs1Barcode(data);
    const lookupCode = gs1?.gtin ?? data;
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

  const handleAddAnother = () => {
    if (product && quantity !== '' && Number(quantity) > 0) {
      cart.addLine(product.id, product.name, product.departmentId, Number(quantity));
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
        departmentId: product.departmentId,
        qtyRequested: Number(quantity),
      });
    }
    if (finalLines.length === 0) return;

    setSubmitting(true);

    // Sepetteki eşyalar farklı departmanlara ait olabilir — her sipariş TEK
    // departmana gider, bu yüzden departmana göre gruplayıp her grup için
    // ayrı bir sipariş (order_id + items[]) gönderiyoruz.
    const groupedByDepartment = new Map<string, typeof finalLines>();
    for (const line of finalLines) {
      const group = groupedByDepartment.get(line.departmentId) ?? [];
      group.push(line);
      groupedByDepartment.set(line.departmentId, group);
    }

    const requestIds: string[] = [];
    const groups: { departmentId: string; items: { partId: string; partName: string; qty: number }[] }[] = [];
    for (const [departmentId, lines] of groupedByDepartment) {
      const createdRequests = await createOrder({
        departmentId,
        items: lines.map((line) => ({ productId: line.partId, quantity: line.qtyRequested })),
        requesterId: user.id,
        requesterName: user.name,
        priority: DEFAULT_PRIORITY,
      });
      requestIds.push(...createdRequests.map((r) => r.id));
      groups.push({
        departmentId,
        items: lines.map((line) => ({ partId: line.partId, partName: line.partName, qty: line.qtyRequested })),
      });
    }
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
          subtitle="Yeni talep"
          onBack={() => navigation.goBack()}
          hint="Karekodu çerçeve içinde tutun"
          onManualEntry={() => navigation.replace('ProductSearch')}
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
            <Stack gap="xs">
              {cartGroups.map(([departmentId, lines]) => {
                const expanded = expandedDepartments.has(departmentId);
                const groupQty = lines.reduce((sum, line) => sum + line.qtyRequested, 0);
                return (
                  <Box key={departmentId} background="surface" radius="md" style={{ overflow: 'hidden' }}>
                    <Pressable
                      onPress={() => toggleDepartment(departmentId)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      }}
                      accessibilityLabel={`${departmentNames[departmentId] ?? departmentId} kalemlerini ${expanded ? 'gizle' : 'göster'}`}
                    >
                      <Stack direction="row" align="center" gap="sm" style={{ flex: 1, marginRight: spacing.sm }}>
                        <Ionicons name="business-outline" size={scale(16)} color={colors.blue} />
                        <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
                          {departmentNames[departmentId] ?? departmentId}
                        </Text>
                      </Stack>
                      <Stack direction="row" align="center" gap="xs">
                        <Text variant="caption" color="textMuted">
                          {lines.length} kalem · {groupQty} adet
                        </Text>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={scale(16)} color={colors.textMuted} />
                      </Stack>
                    </Pressable>

                    {expanded && (
                      <Box style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
                        <Box style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.xs }} />
                        <Stack gap="xs">
                          {lines.map((line) => (
                            <Stack key={line.partId} direction="row" justify="space-between" align="center">
                              <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                                {line.partName} <Text variant="caption" color="textMuted">× {line.qtyRequested}</Text>
                              </Text>
                              <Pressable
                                onPress={() => cart.removeLine(line.partId)}
                                style={{ minWidth: scale(32), minHeight: scale(32) }}
                                accessibilityLabel={`${line.partName} sepetten çıkar`}
                              >
                                <Ionicons name="close" size={scale(18)} color={colors.danger} />
                              </Pressable>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                );
              })}
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