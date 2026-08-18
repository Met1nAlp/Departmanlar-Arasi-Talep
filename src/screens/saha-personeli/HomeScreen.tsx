// src/screens/saha-personeli/HomeScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing, radius } from '../../design-system/tokens';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { canCreateLegacyRequest } from '../../domain/request/legacyAdapter';
import { Ionicons } from '@expo/vector-icons';

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

  // Header'a Ayarlar butonu ekliyoruz — React Navigation'da bunun standart yolu budur.
useEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <Ionicons
        name="settings-outline"
        size={24}
        color={colors.white}
        style={{ marginRight: spacing.md }}
        onPress={() => navigation.navigate('Settings')}
      />
    ),
  });
}, [navigation]);

  if (loading) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white">
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            onPress={() => navigation.navigate('RequestTracking', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Henüz talebiniz yok"
            description="Yeni bir talep oluşturmak için sağ alttaki + butonuna dokunun"
            icon="cube-outline"
          />
        }
      />
      {/* RBAC: "Çağrı oluştur" yetkisi Plan Bölüm 6.3 tablosundan gelir
          (PLANNER hariç herkes) — karar RequestPolicies'te, ekranda değil. */}
            {/* RBAC: "Çağrı oluştur" yetkisi Plan Bölüm 6.3 tablosundan gelir
          (PLANNER hariç herkes) — karar RequestPolicies'te, ekranda değil. */}
      {user && canCreateLegacyRequest(user.role) && (
        <>
          {/* İkinci FAB: çok kalemli (çoklu ürün) talep akışı — birincinin üstünde duruyor */}
          <Pressable
            onPress={() => navigation.navigate('PartSearchForCart')}
            background="surface"
            radius="lg"
            style={{
              position: 'absolute',
              right: spacing.lg,
              bottom: spacing.lg + 64 + spacing.sm,
              width: 56,
              height: 56,
              borderWidth: 1,
              borderColor: colors.blue,
            }}
            accessibilityLabel="Çok kalemli talep oluştur"
          >
            <Ionicons name="cart-outline" size={24} color={colors.blue} />
          </Pressable>

          {/* Birincil FAB: tek ürün, QR tarayarak hızlı talep */}
          <Pressable
            onPress={() => navigation.navigate('PrioritySelect')}
            background="blue"
            radius="lg"
            style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 64, height: 64 }}
            accessibilityLabel="Yeni talep oluştur"
          >
            <Text variant="h1" color="white">
              +
            </Text>
          </Pressable>
        </>
      )}
    </Box>
  );
}