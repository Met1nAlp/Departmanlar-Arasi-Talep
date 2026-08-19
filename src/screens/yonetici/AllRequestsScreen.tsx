// src/screens/yonetici/AllRequestsScreen.tsx — "Tüm Talepler" mockup'ı
import { useEffect, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { TextField } from '../../design-system/components/TextField';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing, colors } from '../../design-system/tokens';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { Department } from '../../types';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'AllRequests'>;

export default function AllRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState('');
  const [activeDept, setActiveDept] = useState<string | null>(null); // null = "Tümü"
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

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const productName = products[r.productId] ?? '';
      const matchesQuery = query.trim() === '' || productName.toLowerCase().includes(query.trim().toLowerCase());
      const matchesDept = !activeDept || r.departmentId === activeDept;
      return matchesQuery && matchesDept;
    });
  }, [requests, products, query, activeDept]);

  if (loading) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box padding="md" style={{ paddingBottom: 0 }}>
        <TextField
          icon="search-outline"
          placeholder="Talep no, parça veya kişi ara"
          value={query}
          onChangeText={setQuery}
        />
        <Stack direction="row" gap="sm" wrap style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
          <FilterChip label="Tümü" active={activeDept === null} onPress={() => setActiveDept(null)} />
          {departments.map((dep) => (
            <FilterChip
              key={dep.id}
              label={dep.name}
              active={activeDept === dep.id}
              onPress={() => setActiveDept(dep.id)}
            />
          ))}
        </Stack>
      </Box>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            onPress={() => navigation.navigate('AuditTimeline', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState title="Kayıtlı talep yok" description="Arama veya filtre kriterlerini değiştirin" icon="search-outline" />
        }
      />
    </Box>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      background={active ? 'blue' : 'surface'}
      radius="lg"
      style={{
        minHeight: 36,
        minWidth: undefined,
        paddingHorizontal: spacing.md,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text variant="caption" color={active ? 'white' : 'textPrimary'} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
