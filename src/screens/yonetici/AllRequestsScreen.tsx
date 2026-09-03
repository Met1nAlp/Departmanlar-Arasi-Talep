// src/screens/yonetici/AllRequestsScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request, Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { TextField } from '../../design-system/components/TextField';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { RequestOrderGroupCard } from '../../design-system/components/RequestOrderGroupCard';
import { groupRequestsByOrder } from '../../domain/request/groupByOrder';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'AllRequests'>;

const priorityColors: Record<Priority, keyof typeof colors> = {
  ACIL: 'amber',
  NORMAL: 'blue',
};

function shortDeptLabel(name: string): string {
  return name.split(' ')[0];
}

export default function AllRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRequests({}), getDepartments()]).then(async ([reqs, deps]) => {
      setRequests(reqs);
      setDepartments(deps);
      const productList = await getProductsByIds(reqs.map((r) => r.productId));
      setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingView />;

  const filtered = requests.filter((r) => {
    if (deptFilter && r.departmentId !== deptFilter) return false;
    if (!query.trim()) return true;
    const haystack = `${r.id} ${products[r.productId] ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  // Aynı sepetten (orderId) gelen talepler ayrı ayrı değil, tek bir sipariş
  // kartı altında gruplanır — bkz. groupByOrder.ts.
  const orderGroups = groupRequestsByOrder(filtered);

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
        <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
          MEPSAN · YÖNETİM
        </Text>
        <Text variant="h1" color="white" style={{ marginTop: 2, marginBottom: spacing.sm }}>
          Tüm Talepler
        </Text>
        <TextField
          icon="search-outline"
          placeholder="Talep no veya parça ara"
          value={query}
          onChangeText={setQuery}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, marginTop: spacing.sm }}
        >
          <FilterChip label={`Tümü · ${requests.length}`} active={deptFilter === null} onPress={() => setDeptFilter(null)} />
          {departments.map((dep) => (
            <FilterChip
              key={dep.id}
              label={shortDeptLabel(dep.name)}
              active={deptFilter === dep.id}
              onPress={() => setDeptFilter(dep.id)}
            />
          ))}
        </ScrollView>
      </Box>

      <FlatList
        data={orderGroups}
        keyExtractor={(group) => group.key}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item: group }) => {
          const firstRequest = group.requests[0];
          const deptName = departments.find((d) => d.id === firstRequest.departmentId)?.name ?? '—';
          const totalQty = group.requests.reduce((sum, r) => sum + r.quantity, 0);
          return (
            <RequestOrderGroupCard
              group={group}
              title={deptName}
              subtitle={`${group.requests.length} kalem · ${totalQty} adet`}
              renderItem={(request) => {
                const requestDeptName = departments.find((d) => d.id === request.departmentId)?.name ?? '—';
                return (
                  <Pressable
                    onPress={() => navigation.navigate('AuditTimeline', { requestId: request.id })}
                    background="surface"
                    radius="md"
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      alignItems: 'flex-start',
                      borderLeftWidth: 4,
                      borderLeftColor: colors[priorityColors[request.priority]],
                    }}
                  >
                    <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                      <Text variant="caption" color="textMuted" numberOfLines={1} style={{ letterSpacing: 1, flexShrink: 1, marginRight: spacing.sm }}>
                        {requestDeptName.toUpperCase()}
                      </Text>
                      <PriorityBadge priority={request.priority} />
                    </Stack>
                    <Text variant="bodyBold" numberOfLines={2} style={{ marginTop: spacing.xs }}>
                      {products[request.productId]}
                    </Text>
                    <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
                      <Text variant="caption" color="textMuted">
                        {request.quantity} adet
                      </Text>
                      <StatusChip status={request.status} />
                    </Stack>
                  </Pressable>
                );
              }}
            />
          );
        }}
        ListEmptyComponent={<EmptyState title="Kayıtlı talep yok" icon="file-tray-outline" />}
      />
    </Box>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      radius="lg"
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: undefined,
        minWidth: undefined,
        backgroundColor: active ? colors.white : 'rgba(255,255,255,0.14)',
      }}
    >
      <Text variant="body" color={active ? 'blue' : 'white'} style={{ fontWeight: '700', opacity: active ? 1 : 0.9 }}>
        {label}
      </Text>
    </Pressable>
  );
}