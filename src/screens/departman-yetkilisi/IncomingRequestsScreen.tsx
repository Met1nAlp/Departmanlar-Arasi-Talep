import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';

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

// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok (Efe'nin E1
// maddesi) — hepsi 'NORMAL' varsayılıyor. Gerçek veri gelince kartın sol
// renkli şeridi ve rozeti otomatik olarak öncelik rengine göre değişecek.
const FAKE_PRIORITY: Priority = 'NORMAL';
const priorityColors: Record<Priority, keyof typeof colors> = {
  LINE_DOWN: 'danger',
  URGENT: 'warning',
  NORMAL: 'blue',
  PLANNED: 'textMuted',
};

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    Promise.all([getRequests({ departmentId: user.departmentId }), getDepartments()]).then(
      async ([reqs, departments]) => {
        setRequests(reqs);
        setDepartmentName(departments.find((d) => d.id === user.departmentId)?.name ?? '');
        const productList = await getProductsByIds(reqs.map((r) => r.productId));
        setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
        setLoading(false);
      }
    );
  }, [user]);

  if (loading) return <LoadingView />;

  // Teslim edilmiş talepler artık hazırlama kuyruğunun bir parçası değil.
  const queue = requests.filter((r) => r.status !== 'TESLIM_EDILDI');

  // GEÇİCİ: [...requests].sort((a,b) => priorityRank[a.priority] - priorityRank[b.priority] || ...)
  // Priority alanı gelene kadar hepsi eşit rank'te, sadece oluşturulma zamanına göre sıralanıyor.
  const sortedRequests = [...queue].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

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
        <Stack direction="row" justify="space-between" align="center">
          <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
            {departmentName.toUpperCase()}
          </Text>
          <Stack direction="row" gap="md">
            <Pressable onPress={() => navigation.navigate('MaterialRequestQueue')} accessibilityLabel="Çok kalemli talepler">
              <Ionicons name="layers-outline" size={22} color={colors.white} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')} accessibilityLabel="Ayarlar">
              <Ionicons name="settings-outline" size={22} color={colors.white} />
            </Pressable>
          </Stack>
        </Stack>

        <Stack direction="row" justify="space-between" align="flex-end" style={{ marginTop: spacing.xs }}>
          <Text variant="h1" color="white">
            Hazırlama Kuyruğu
          </Text>
          <Box style={{ alignItems: 'flex-end' }}>
            <Text variant="h1" color="white">
              {queue.length}
            </Text>
            <Text variant="caption" color="white" style={{ opacity: 0.75 }}>
              bekleyen
            </Text>
          </Box>
        </Stack>
      </Box>

      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
            background="surface"
            radius="md"
            style={{
              width: '100%',
              padding: spacing.md,
              alignItems: 'flex-start',
              borderLeftWidth: 4,
              borderLeftColor: colors[priorityColors[FAKE_PRIORITY]],
            }}
          >
            <PriorityBadge priority={FAKE_PRIORITY} />
            <Text variant="bodyBold" style={{ marginTop: spacing.sm }}>
              {products[item.productId]}
            </Text>
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
              <Text variant="caption" color="textMuted">
                {item.quantity} adet
              </Text>
              <StatusChip status={item.status} />
            </Stack>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title="Kuyruk boş" description="Şu an bekleyen talep yok" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}
