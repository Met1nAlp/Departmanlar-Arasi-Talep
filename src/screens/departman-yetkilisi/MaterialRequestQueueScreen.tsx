import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { MaterialRequest } from '../../contracts/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { PriorityBadge } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing } from '../../design-system/tokens';
import { getMaterialRequestsBySupplierDept } from '../../api/materialRequests';
import { useActiveUser } from '../../store/authStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'MaterialRequestQueue'>;

// Terminal durumdaki (CLOSED/CANCELLED) veya zaten teslim edilmiş talepleri
// kuyrukta göstermiyoruz — burası "yapılacak işler" listesi.
const ACTIVE_STATES = ['PENDING', 'ACKNOWLEDGED', 'PREPARING', 'PARTIALLY_READY'];

export default function MaterialRequestQueueScreen() {
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    getMaterialRequestsBySupplierDept(user.departmentId).then((reqs) => {
      setRequests(reqs.filter((r) => ACTIVE_STATES.includes(r.state)));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white">
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PartialFulfillment', { requestId: item.id })}
            background="surface"
            radius="md"
            style={{ width: '100%', marginBottom: spacing.sm, padding: spacing.md, alignItems: 'flex-start' }}
          >
            <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
              <Text variant="bodyBold">{item.requestNo}</Text>
              <PriorityBadge priority={item.priority} />
            </Stack>
            <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
              {item.lines.length} kalem
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title="Çok kalemli talep yok" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}