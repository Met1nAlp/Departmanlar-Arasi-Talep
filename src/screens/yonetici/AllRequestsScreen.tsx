// src/screens/yonetici/AllRequestsScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
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
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'AllRequests'>;

// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok (Efe'nin E1 maddesi) —
// diğer ekranlardaki (IncomingRequests, RequestDetail) aynı yer tutucuyla tutarlı.
const FAKE_PRIORITY: Priority = 'NORMAL';
const priorityColors: Record<Priority, keyof typeof colors> = {
  ACIL: 'danger',
  NORMAL: 'blue',
};

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
          MTS · YÖNETİM
        </Text>
        <Text variant="h2" color="white" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          Tüm Talepler
        </Text>
        <TextField
          icon="search-outline"
          placeholder="Talep no veya parça ara"
          value={query}
          onChangeText={setQuery}
        />
        <Stack direction="row" gap="sm" wrap style={{ marginTop: spacing.md }}>
          <FilterChip label={`Tümü · ${requests.length}`} active={deptFilter === null} onPress={() => setDeptFilter(null)} />
          {departments.map((dep) => (
            <FilterChip
              key={dep.id}
              label={dep.name}
              active={deptFilter === dep.id}
              onPress={() => setDeptFilter(dep.id)}
            />
          ))}
        </Stack>
      </Box>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('AuditTimeline', { requestId: item.id })}
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
            <Stack direction="row" justify="space-between" align="center" gap="sm" style={{ width: '100%' }}>
              <Text
                variant="caption"
                color="textMuted"
                numberOfLines={1}
                style={{ letterSpacing: 1, flexShrink: 1 }}
              >
                {item.id.toUpperCase()} · {departments.find((d) => d.id === item.departmentId)?.name.toUpperCase()}
              </Text>
              <PriorityBadge priority={FAKE_PRIORITY} />
            </Stack>
            <Text variant="bodyBold" style={{ marginTop: spacing.xs }}>
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
        ListEmptyComponent={<EmptyState title="Kayıtlı talep yok" icon="file-tray-outline" />}
      />
    </Box>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      background={active ? 'white' : 'blueMedium'}
      radius="lg"
      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}
    >
      <Text variant="bodyBold" color={active ? 'blue' : 'white'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
