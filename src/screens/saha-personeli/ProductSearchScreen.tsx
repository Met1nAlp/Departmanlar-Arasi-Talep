// src/screens/saha-personeli/ProductSearchScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Product } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { TextField } from '../../design-system/components/TextField';
import { EmptyState } from '../../design-system/components/EmptyState';
import { spacing } from '../../design-system/tokens';
import { mockProducts } from '../../mocks/products';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'ProductSearch'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'ProductSearch'>;

// GEÇİCİ: mockProducts içinden filtreliyoruz. Efe'nin katalog delta senkron
// endpoint'i (E3) hazır olunca burası gerçek API + FlashList + FTS5'e bağlanacak.
export default function ProductSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>(mockProducts);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const filtered = mockProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }, 150); // PDF'in önerdiği 150ms debounce

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (product: Product) => {
    // Çok satırlı sepet henüz yok (Efe'nin domain katmanı sonrası eklenecek) —
    // şimdilik doğrudan QR akışındaki gibi tek ürün seçimini geri döndürüyoruz.
    navigation.navigate('QRScan', { departmentId: route.params.departmentId, preselectedProduct: product });
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
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            background="surface"
            radius="md"
            style={{ width: '100%', marginBottom: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'flex-start' }}
          >
            <Stack gap="xs">
              <Text variant="bodyBold">{item.name}</Text>
              <Text variant="caption" color="textMuted">
                Kod: {item.qrCode}
              </Text>
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