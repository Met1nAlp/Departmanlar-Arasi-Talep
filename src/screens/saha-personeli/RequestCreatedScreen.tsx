// src/screens/saha-personeli/RequestCreatedScreen.tsx
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getMaterialRequestById } from '../../api/materialRequests';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestCreated'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'RequestCreated'>;

interface Summary {
  requestNo: string;
  itemCount: number;
  totalQty: number;
  departmentName?: string;
  // Talebi Görüntüle yalnızca eski (tek kalemli) çağrı akışı için çalışıyor —
  // RequestTrackingScreen henüz çok kalemli MaterialRequest'i desteklemiyor.
  trackable: boolean;
}

export default function RequestCreatedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [legacy, material, departments] = await Promise.all([
        getRequestById(route.params.requestId),
        getMaterialRequestById(route.params.requestId),
        getDepartments(),
      ]);
      if (cancelled) return;

      if (legacy) {
        setSummary({
          requestNo: legacy.id,
          itemCount: 1,
          totalQty: legacy.quantity,
          departmentName: departments.find((d) => d.id === legacy.departmentId)?.name,
          trackable: true,
        });
      } else if (material) {
        setSummary({
          requestNo: material.requestNo,
          itemCount: material.lines.length,
          totalQty: material.lines.reduce((sum, l) => sum + l.qtyRequested, 0),
          departmentName: departments.find((d) => d.id === material.supplierDeptId)?.name,
          trackable: false,
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [route.params.requestId]);

  const goHome = () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));

  if (!summary) return <LoadingView />;

  return (
    <Box
      style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
      background="white"
      paddingHorizontal="lg"
    >
      <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Box
          background="blue"
          style={{ width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </Box>
        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          Talebiniz oluşturuldu
        </Text>
        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
          {summary.departmentName ? `${summary.departmentName} ekibi bilgilendirildi. ` : ''}
          Durum değiştikçe cihazınıza bildirim gelecek.
        </Text>

        <Box background="surface" radius="md" style={{ width: '100%', marginTop: spacing.xl }}>
          <SummaryRow label="Talep no" value={summary.requestNo} />
          <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
          <SummaryRow label="Kalem" value={`${summary.itemCount} kalem · ${summary.totalQty} adet`} />
        </Box>
      </Stack>

      <Box>
        <Button label="Ana Ekrana Dön" onPress={goHome} />
        {summary.trackable && (
          <Button
            label="Talebi Görüntüle"
            onPress={() => navigation.navigate('RequestTracking', { requestId: route.params.requestId })}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </Box>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="space-between" style={{ padding: spacing.md }}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </Stack>
  );
}
