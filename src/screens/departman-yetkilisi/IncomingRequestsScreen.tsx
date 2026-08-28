// src/screens/departman-yetkilisi/IncomingRequestsScreen.tsx
import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { scale } from '../../design-system/tokens/scale';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { useActiveUser } from '../../store/authStore';
import { NotificationBell } from '../../design-system/components/NotificationBell';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

type Filter = 'aktif' | 'kismi' | 'tamamlanan';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'kismi', label: 'Kısmi' },
  { key: 'tamamlanan', label: 'Tamamlanan' },
];

const priorityColors: Record<Priority, keyof typeof colors> = {
  ACIL: 'danger',
  NORMAL: 'blue',
};

function getRelativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  return `${Math.floor(diffMin / 60)} sa önce`;
}

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('aktif');

  useFocusEffect(
    useCallback(() => {
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
    }, [user])
  );

  useRequestUpdates((updated) => {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (exists) return prev.map((r) => (r.id === updated.id ? updated : r));
      return updated.departmentId === user?.departmentId ? [...prev, updated] : prev;
    });
  });

  if (loading) return <LoadingView />;

  const isTerminal = (r: Request) => r.status === 'IPTAL_EDILDI' || r.status === 'REDDEDILDI';
  const isPartial = (r: Request) =>
    r.fulfilledQuantity !== undefined &&
    r.fulfilledQuantity > 0 &&
    r.fulfilledQuantity < r.quantity &&
    (r.status === 'HAZIRLANIYOR' || r.status === 'HAZIR');

  const nonCancelled = requests.filter((r) => !isTerminal(r));

  const queue = nonCancelled.filter((r) => {
    if (filter === 'kismi') return isPartial(r);
    if (filter === 'aktif') return r.status !== 'TESLIM_EDILDI' && !isPartial(r);
    return r.status === 'TESLIM_EDILDI';
  });
  const sortedRequests = [...queue].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeScope = nonCancelled.filter((r) => r.status !== 'TESLIM_EDILDI');
  const receivedCount = activeScope.filter((r) => r.status === 'TALEP_ALINDI').length;
  const preparingCount = activeScope.filter((r) => r.status === 'HAZIRLANIYOR' && !isPartial(r)).length;

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      >
        <Stack direction="row" justify="space-between" align="flex-start">
          <Box style={{ flex: 1 }}>
            <Text
              variant="caption"
              color="white"
              numberOfLines={1}
              style={{ opacity: 0.75, letterSpacing: 1 }}
            >
              {departmentName.toUpperCase()}
            </Text>
            <Text variant="h2" color="white">
              Hazırlama Kuyruğu
            </Text>
          </Box>
          <Stack direction="row" gap="sm">
            <NotificationBell />
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              background="blueMedium"
              style={{ borderRadius: 999, width: scale(38), height: scale(38), minWidth: scale(38), minHeight: scale(38) }}
              accessibilityLabel="Ayarlar"
            >
              <Ionicons name="settings-outline" size={scale(18)} color={colors.white} />
            </Pressable>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          style={{
            marginTop: spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderRadius: radius.lg,
            padding: 3,
          }}
        >
          {FILTERS.map(({ key, label }) => {
            const count = key === 'aktif' ? activeScope.length : key === 'kismi' ? nonCancelled.filter(isPartial).length : nonCancelled.filter((r) => r.status === 'TESLIM_EDILDI').length;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                background={filter === key ? 'white' : undefined}
                radius="lg"
                style={{ flex: 1, paddingVertical: 7, minHeight: undefined }}
              >
                <Text variant="body" color={filter === key ? 'blue' : 'white'} style={{ fontWeight: '700', fontSize: scale(14), textAlign: 'center' }}>
                  {label}{count > 0 ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </Stack>
      </Box>

      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => {
          const priority = item.priority;
          return (
            <Pressable
              onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
              background="surface"
              radius="md"
              style={{
                width: '100%',
                padding: spacing.md,
                alignItems: 'flex-start',
                borderLeftWidth: 4,
                borderLeftColor: colors[priorityColors[priority]],
              }}
            >
              <Stack direction="row" justify="space-between" align="flex-start" style={{ width: '100%' }}>
                <Text variant="bodyBold" numberOfLines={2} style={{ flex: 1, marginRight: spacing.sm }}>
                  {products[item.productId]}
                </Text>
                <StatusChip status={item.status} />
              </Stack>

              <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {item.requesterName ?? item.requesterId}
              </Text>

              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.sm }}>
                <PriorityBadge priority={priority} />
                <Stack direction="row" align="center" gap="xs">
                  <Text variant="bodyBold" color="textPrimary">
                    {isPartial(item) ? `${item.fulfilledQuantity}/${item.quantity}` : item.quantity}
                  </Text>
                  <Text variant="caption" color="textMuted">adet</Text>
                  <Text variant="caption" color="textMuted" style={{ marginLeft: spacing.xs }}>
                    · {getRelativeTime(item.createdAt)}
                  </Text>
                </Stack>
              </Stack>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="Kuyruk boş" description="Şu an bekleyen talep yok" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}