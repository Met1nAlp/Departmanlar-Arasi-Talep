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
import { getDepartments } from '../../api/departments';
import { scale } from '../../design-system/tokens/scale';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestCreated'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'RequestCreated'>;

interface Summary {
  requestIds: string[];
  itemCount: number;
  totalQty: number;
  departmentName?: string;
}

export default function RequestCreatedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const requests = await Promise.all(
        route.params.requestIds.map((id) => getRequestById(id))
      );
      const found = requests.filter((r): r is NonNullable<typeof r> => !!r);
      if (cancelled || found.length === 0) return;

      const departments = await getDepartments();
      if (cancelled) return;

      setSummary({
        requestIds: found.map((r) => r.id),
        itemCount: found.length,
        totalQty: found.reduce((sum, r) => sum + r.quantity, 0),
        departmentName: departments.find((d) => d.id === found[0].departmentId)?.name,
      });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [route.params.requestIds]);

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
          style={{ width: scale(72), height: scale(72), borderRadius: scale(999), alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </Box>
        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {summary.itemCount > 1 ? 'Talepleriniz oluşturuldu' : 'Talebiniz oluşturuldu'}
        </Text>
        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
          {summary.departmentName ? `${summary.departmentName} ekibi bilgilendirildi. ` : ''}
          Durum değiştikçe cihazınıza bildirim gelecek.
        </Text>

        <Box background="surface" radius="md" style={{ width: '100%', marginTop: spacing.xl }}>
          <SummaryRow
            label={summary.itemCount > 1 ? 'Talep no\'ları' : 'Talep no'}
            value={summary.requestIds.map((id) => id.toUpperCase()).join(', ')}
          />
          <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
          <SummaryRow label="Kalem" value={`${summary.itemCount} kalem · ${summary.totalQty} adet`} />
        </Box>
      </Stack>

      <Box>
        <Button label="Ana Ekrana Dön" onPress={goHome} />
        {summary.itemCount === 1 && (
          <Button
            label="Talebi Görüntüle"
            onPress={() => navigation.navigate('RequestTracking', { requestId: summary.requestIds[0] })}
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
      <Text variant="bodyBold" numberOfLines={2} style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </Stack>
  );
}