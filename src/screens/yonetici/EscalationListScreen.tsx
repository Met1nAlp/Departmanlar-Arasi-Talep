import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge } from '../../design-system/components/PriorityBadge';
import { SlaTimer } from '../../design-system/components/SlaTimer';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'EscalationList'>;

// GEÇİCİ: SLA süresi henüz Request tipinde yok (Efe'nin SlaPolicy.ts / E1 maddesi).
// Şimdilik her talebin oluşturulma anından 30 dk sonrasını sahte SLA kabul ediyoruz —
// IncomingRequestsScreen'de kullandığımız aynı mock mantık, tek kaynak olsun diye
// burada da tekrar ediyoruz (Efe'nin alanı gelince ikisi de item.slaDueAt'e geçecek).
function getMockSlaDueAt(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + 30 * 60000).toISOString();
}

function isOverdue(createdAt: string): boolean {
  return new Date(getMockSlaDueAt(createdAt)).getTime() < Date.now();
}

export default function EscalationListScreen() {
  const navigation = useNavigation<Nav>();
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

  // Sadece henüz teslim edilmemiş VE süresi dolmuş talepleri gösteriyoruz —
  // bu, "acil ilgilenilmesi gereken" tanımının en basit hali.
  const escalated = requests
    .filter((r) => r.status !== 'TESLIM_EDILDI' && isOverdue(r.createdAt))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <Box style={{ flex: 1 }} background="white">
      <FlatList
        data={escalated}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ChangePriority', { requestId: item.id })}
            background="surface"
            radius="md"
            style={{ width: '100%', marginBottom: spacing.sm, padding: spacing.md, alignItems: 'flex-start' }}
          >
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
              <Text variant="bodyBold">{products[item.productId]}</Text>
              <StatusChip status={item.status} />
            </Stack>
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
              <PriorityBadge priority="NORMAL" />
              <SlaTimer dueAt={getMockSlaDueAt(item.createdAt)} />
            </Stack>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Eskalasyon yok"
            description="Süresi dolan bekleyen talep bulunmuyor"
            icon="checkmark-done-outline"
          />
        }
      />
    </Box>
  );
}