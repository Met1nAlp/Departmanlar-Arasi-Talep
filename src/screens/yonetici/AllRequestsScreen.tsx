// src/screens/yonetici/AllRequestsScreen.tsx
import { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'AllRequests'>;

export default function AllRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequests({}).then(async (reqs) => {
      setRequests(reqs);
      const productList = await getProductsByIds(reqs.map((r) => r.productId));
      setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
      setLoading(false);
    });
  }, []);

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
        renderItem={({ item }) => <RequestCard request={item} productName={products[item.productId]}
        onPress={() => navigation.navigate('AuditTimeline', { requestId: item.id })}
      />}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Kayıtlı talep yok
          </Text>
        }
      />
    </View>
  );
}