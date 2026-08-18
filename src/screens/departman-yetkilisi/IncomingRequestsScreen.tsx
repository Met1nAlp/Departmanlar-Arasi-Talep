import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { SlaTimer } from '../../design-system/components/SlaTimer';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

// Öncelik sırası — LINE_DOWN her zaman en üstte, PLANNED en altta.
// Efe'nin domain katmanında (RequestPolicies.ts) bu mantık resmileşecek,
// biz şimdilik ekranda basit bir sıralama fonksiyonuyla gösteriyoruz.
const priorityRank: Record<Priority, number> = {
  LINE_DOWN: 0,
  URGENT: 1,
  NORMAL: 2,
  PLANNED: 3,
};

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!user?.departmentId) return;
  getRequests({ departmentId: user.departmentId }).then(async (reqs) => {
    setRequests(reqs);
    const productList = await getProductsByIds(reqs.map((r) => r.productId));
    setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
    setLoading(false);
  });
}, [user]);

useEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <Stack direction="row" gap="md" style={{ marginRight: spacing.md }}>
        <Ionicons
          name="layers-outline"
          size={24}
          color={colors.white}
          onPress={() => navigation.navigate('MaterialRequestQueue')}
        />
        <Ionicons
          name="settings-outline"
          size={24}
          color={colors.white}
          onPress={() => navigation.navigate('Settings')}
        />
      </Stack>
    ),
  });
}, [navigation]);

  if (loading) return <LoadingView />;

  // GEÇİCİ: priority alanı henüz Request tipinde yok (Efe'nin E1 maddesi).
  // Şimdilik hepsini 'NORMAL' varsayıp createdAt'e göre (eskiden yeniye) sıralıyoruz.
  // Efe'nin tipleri gelince: [...requests].sort((a,b) => priorityRank[a.priority] - priorityRank[b.priority] || ...)
  const sortedRequests = [...requests].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <Box style={{ flex: 1 }} background="white">
      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
            background="surface"
            radius="md"
            style={{ width: '100%', marginBottom: spacing.sm, padding: spacing.md, alignItems: 'flex-start' }}
          >
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
              <Text variant="bodyBold">{products[item.productId]}</Text>
              <StatusChip status={item.status} />
            </Stack>
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
              {/* GEÇİCİ: gerçek priority alanı gelince item.priority olacak */}
              <PriorityBadge priority="NORMAL" />
              {/* GEÇİCİ: gerçek slaDueAt alanı gelince item.slaDueAt olacak.
                  Şimdilik oluşturulma anından 30 dk sonrasını sahte SLA olarak gösteriyoruz. */}
              <SlaTimer dueAt={new Date(new Date(item.createdAt).getTime() + 30 * 60000).toISOString()} />
            </Stack>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Kuyruk boş"
            description="Şu an bekleyen talep yok"
            icon="checkmark-done-outline"
          />
        }
      />
    </Box>
  );
}