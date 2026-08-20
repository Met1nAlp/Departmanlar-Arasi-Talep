import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { MaterialRequest, RequestState } from '../../contracts/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getMaterialRequestsBySupplierDept } from '../../api/materialRequests';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'MaterialRequestQueue'>;

// Terminal durumdaki (CLOSED/CANCELLED) veya zaten teslim edilmiş talepleri
// kuyrukta göstermiyoruz — burası "yapılacak işler" listesi.
const ACTIVE_STATES: RequestState[] = ['PENDING', 'ACKNOWLEDGED', 'PREPARING', 'PARTIALLY_READY'];

const stateLabels: Record<string, string> = {
  PENDING: 'Bekliyor',
  ACKNOWLEDGED: 'Üstlenildi',
  PREPARING: 'Hazırlanıyor',
  PARTIALLY_READY: 'Kısmi Hazır',
};

const priorityColors: Record<Priority, keyof typeof colors> = {
  LINE_DOWN: 'danger',
  URGENT: 'warning',
  NORMAL: 'blue',
  PLANNED: 'textMuted',
};

export default function MaterialRequestQueueScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    Promise.all([getMaterialRequestsBySupplierDept(user.departmentId), getDepartments()]).then(
      ([reqs, departments]) => {
        setRequests(reqs.filter((r) => ACTIVE_STATES.includes(r.state)));
        setDepartmentName(departments.find((d) => d.id === user.departmentId)?.name ?? '');
        setLoading(false);
      }
    );
  }, [user]);

  if (loading) return <LoadingView />;

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
          <Box style={{ flex: 1 }}>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {departmentName.toUpperCase()}
            </Text>
            <Stack direction="row" justify="space-between" align="flex-end">
              <Text variant="h2" color="white">
                Çok Kalemli Talepler
              </Text>
              <Text variant="h2" color="white">
                {requests.length}
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        ItemSeparatorComponent={() => <Box style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const totalQty = item.lines.reduce((sum, l) => sum + l.qtyRequested, 0);
          return (
            <Pressable
              onPress={() => navigation.navigate('PartialFulfillment', { requestId: item.id })}
              background="surface"
              radius="md"
              style={{
                width: '100%',
                padding: spacing.md,
                alignItems: 'flex-start',
                borderLeftWidth: 4,
                borderLeftColor: colors[priorityColors[item.priority]],
              }}
            >
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                <Text variant="bodyBold">{item.requestNo}</Text>
                <PriorityBadge priority={item.priority} />
              </Stack>
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
                <Text variant="caption" color="textMuted">
                  {item.lines.length} kalem · {totalQty} adet
                </Text>
                <Box background="blueLight" radius="sm" style={{ paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                  <Text variant="caption" color="blue" style={{ fontWeight: '700' }}>
                    {stateLabels[item.state] ?? item.state}
                  </Text>
                </Box>
              </Stack>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="Çok kalemli talep yok" description="Şu an bekleyen bir talep yok" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}
