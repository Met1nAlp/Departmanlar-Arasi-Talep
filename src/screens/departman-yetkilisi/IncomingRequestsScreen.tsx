// src/screens/departman-yetkilisi/IncomingRequestsScreen.tsx
import { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useAuthStore } from '../../store/authStore';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Gelen talep yok
          </Text>
        }
      />
    </View>
  );
}