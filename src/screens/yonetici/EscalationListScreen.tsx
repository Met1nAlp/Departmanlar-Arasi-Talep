import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'EscalationList'>;

// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok — diğer ekranlardaki
// aynı yer tutucuyla tutarlı (IncomingRequests, RequestDetail, AllRequests).
const FAKE_PRIORITY: Priority = 'NORMAL';

export default function EscalationListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Yönetici rolü departmentId/userId filtresi olmadan çağırıyor —
    // getRequests({}) tüm talepleri döndürüyor (AllRequestsScreen'de de aynı çağrı kullanılıyor).
    getRequests({}).then(async (reqs) => {
      setRequests(reqs);
      const productList = await getProductsByIds(reqs.map((r) => r.productId));
      setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingView />;

  // GEÇİCİ: gerçek bir SLA/slaDueAt alanı gelene kadar "eskalasyon" listesini
  // otomatik bir eşiğe göre seçemiyoruz — bunun yerine en uzun süredir açık
  // olan (henüz teslim edilmemiş) talepleri gösteriyoruz, yöneticinin kendi
  // takdirine bırakıyoruz.
  const openOldestFirst = requests
    .filter((r) => r.status !== 'TESLIM_EDILDI')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

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
            <Text variant="h1" color="white">
              Eskalasyon Listesi
            </Text>
            <Text variant="caption" color="white" style={{ opacity: 0.75, marginTop: 2 }}>
              {openOldestFirst.length} kayıt · en eski önce
            </Text>
          </Box>
        </Stack>
      </Box>

      <FlatList
        data={openOldestFirst}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Box background="surface" radius="md" padding="md">
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="bodyBold" style={{ flex: 1 }}>
                {products[item.productId]}
              </Text>
              <StatusChip status={item.status} />
            </Stack>
            <Stack direction="row" justify="space-between" align="center" style={{ marginTop: spacing.xs }}>
              <PriorityBadge priority={FAKE_PRIORITY} />
              <Text variant="caption" color="textMuted">
                {item.id.toUpperCase()} · {item.quantity} adet
              </Text>
            </Stack>
            <Button
              label="Önceliği Değiştir"
              onPress={() => navigation.navigate('ChangePriority', { requestId: item.id })}
              style={{ marginTop: spacing.md }}
            />
          </Box>
        )}
        ListEmptyComponent={
          <EmptyState title="Eskalasyon yok" description="Bekleyen açık talep bulunmuyor" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}
