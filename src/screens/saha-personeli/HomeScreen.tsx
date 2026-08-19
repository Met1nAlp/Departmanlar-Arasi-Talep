// src/screens/saha-personeli/HomeScreen.tsx (güncellenmiş kısım)
import { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request, Product } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { canCreateLegacyRequest } from '../../domain/request/legacyAdapter';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRequests({ userId: user.id }).then(async (reqs) => {
      setRequests(reqs);
      const productList = await getProductsByIds(reqs.map((r) => r.productId));
      const nameMap = Object.fromEntries(productList.map((p) => [p.id, p.name]));
      setProducts(nameMap);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            onPress={() => navigation.navigate('RequestTracking', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Henüz talebiniz yok
          </Text>
        }
      />
      {user && canCreateLegacyRequest(user.role) && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('DepartmentSelect')}>
          <Text style={{ color: colors.white, fontSize: 28, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.blue, justifyContent: 'center', alignItems: 'center', elevation: 3,
  },
});