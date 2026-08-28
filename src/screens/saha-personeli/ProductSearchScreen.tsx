// src/screens/saha-personeli/ProductSearchScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { getAllProducts } from '../../api/products';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'ProductSearch'>;

export default function ProductSearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getAllProducts().then((products) => {
      if (ignore) return;
      setAllProducts(products);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timeout);
  }, [query]);

  const results = allProducts.filter((p) =>
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const handleSelect = (product: Product) => {
    navigation.replace('QRScan', { preselectedProduct: product });
  };

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
        <Stack direction="row" align="center" gap="md" style={{ marginBottom: spacing.md }}>
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Text variant="h2" color="white">
            Ürün Ara
          </Text>
        </Stack>
        <TextField
          icon="search-outline"
          placeholder="Ürün adı ile ara..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </Box>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg, gap: spacing.sm, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
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
                  style={{ width: scale(44), height: scale(44), alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="cube-outline" size={scale(22)} color={colors.blue} />
                </Box>
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text variant="bodyBold" numberOfLines={1}>{item.name}</Text>
                  <Text variant="mono" color="textMuted">
                    {item.qrCode}
                  </Text>
                </Stack>
                <Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />
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
      )}
    </Box>
  );
}