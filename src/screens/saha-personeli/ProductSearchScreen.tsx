// src/screens/saha-personeli/ProductSearchScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Product } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { TextField } from '../../design-system/components/TextField';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing } from '../../design-system/tokens';
import { getProductsByDepartment } from '../../api/products';
import { LoadingView } from '../../design-system/components/LoadingView';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'ProductSearch'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'ProductSearch'>;

export default function ProductSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Departmanın ürünlerini bir kez çek. "ignore" flag'i, bu istekten önceki
  // (eski) bir isteğin cevabı geç gelirse state'i ezmesini önler — sunucudan
  // veri gelip kısa süre sonra tekrar boşalıp tekrar dolma görüntüsünün sebebi
  // buydu (iki farklı cevabın state'i sırayla ezmesi).
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getProductsByDepartment(route.params.departmentId).then((products) => {
      if (ignore) return;
      setAllProducts(products);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [route.params.departmentId]);

  // Arama debounce'u artık sadece query'yi geciktiriyor, ayrı bir "results"
  // state'ine yazmıyor — bu yüzden allProducts değiştiğinde ikinci bir
  // gecikmeli setResults çağrısının onu ezme ihtimali kalmıyor.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timeout);
  }, [query]);

  const results = allProducts.filter((p) =>
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  if (loading) return <LoadingView />;

  const handleSelect = (product: Product) => {
    navigation.replace('QRScan', { departmentId: route.params.departmentId, priority: route.params.priority, preselectedProduct: product });
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <TextField
        icon="search-outline"
        placeholder="Ürün adı ile ara..."
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={{ marginTop: spacing.md }}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            background="surface"
            radius="md"
            style={{ width: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
          >
            <Stack direction="row" align="center" gap="md" style={{ width: '100%' }}>
              <Box
                background="blueLight"
                radius="md"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cube-outline" size={22} color={colors.blue} />
              </Box>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text variant="bodyBold">{item.name}</Text>
                <Text variant="caption" color="textMuted">
                  Kod: {item.qrCode}
                </Text>
              </Stack>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Stack>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Sonuç bulunamadı"
            description="Farklı bir arama terimi deneyin"
            icon="search-outline"
          />
        }
      />
    </Box>
  );
}