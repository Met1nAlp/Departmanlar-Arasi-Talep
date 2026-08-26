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
      console.log('[FOCUS] IncomingRequests odaklandı, veri çekiliyor');
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

  // İstatistik kutuları her zaman "aktif" kapsamına göre hesaplanır (filtreden bağımsız).
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
          paddingBottom: spacing.md,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      >
        <Stack direction="row" justify="space-between" align="center">
          <Text
            variant="bodyBold"
            color="white"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ opacity: 0.85, letterSpacing: 1, fontSize: 18, flexShrink: 1 }}
          >
            {departmentName.toUpperCase()}
          </Text>
          <Stack direction="row" gap="sm">
            <NotificationBell />
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              background="blueMedium"
              style={{ borderRadius: 999 }}
              accessibilityLabel="Ayarlar"
            >
              <Ionicons name="settings-outline" size={22} color={colors.white} />
            </Pressable>
          </Stack>
        </Stack>

        <Text variant="h1" color="white" style={{ marginTop: spacing.md, alignSelf: 'center' }}>
          Hazırlama Kuyruğu
        </Text>

        <Stack
          direction="row"
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.blueDark,
            borderRadius: radius.lg,
            padding: 3,
          }}
        >
          {FILTERS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              background={filter === key ? 'white' : undefined}
              radius="lg"
              style={{ flex: 1, paddingVertical: 6, minHeight: undefined }}
            >
              <Text variant="caption" color={filter === key ? 'blue' : 'white'} style={{ fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Stack>

        <Stack direction="row" gap="sm" style={{ marginTop: spacing.md }}>
          <StatBox value={receivedCount} label="talep alındı" />
          <StatBox value={preparingCount} label="hazırlanıyor" />
          <StatBox value={activeScope.length} label="bekleyen" />
        </Stack>
      </Box>

      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => {
          const priority = item.priority;
          const isCancelledOrRejected = item.status === 'IPTAL_EDILDI' || item.status === 'REDDEDILDI';
          return (
            <Pressable
              onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
              background={isCancelledOrRejected ? 'dangerLight' : 'surface'}
              radius="md"
              style={{
                width: '100%',
                padding: spacing.md,
                alignItems: 'flex-start',
                borderLeftWidth: 4,
                borderLeftColor: isCancelledOrRejected ? colors.danger : colors[priorityColors[priority]],
                opacity: isCancelledOrRejected ? 0.75 : 1,
              }}
            >
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                <PriorityBadge priority={priority} />
                <Text variant="caption" color="textMuted">
                  {getRelativeTime(item.createdAt)}
                </Text>
              </Stack>
              <Text variant="bodyBold" style={{ marginTop: spacing.sm }}>
                {products[item.productId]}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {item.requesterName ?? item.requesterId}
              </Text>
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
                <Text variant="caption" color="textMuted">
                  {isPartial(item) ? `${item.fulfilledQuantity}/${item.quantity} adet` : `${item.quantity} adet`}
                </Text>
                <StatusChip status={item.status} />
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

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: colors.blueDark,
        borderRadius: radius.md,
        padding: spacing.sm,
        alignItems: 'center',
      }}
    >
      <Text variant="h2" color="white">
        {value}
      </Text>
      <Text variant="caption" color="white" style={{ opacity: 0.75 }}>
        {label}
      </Text>
    </Box>
  );
}