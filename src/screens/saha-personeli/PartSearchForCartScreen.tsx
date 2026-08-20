import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { TextField } from '../../design-system/components/TextField';
import { Button } from '../../design-system/components/Button';
import { EmptyState } from '../../design-system/components/EmptyState';
import { spacing, colors } from '../../design-system/tokens';
import { mockProducts } from '../../mocks/products';
import { useCartStore } from '../../store/cartStore';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'PartSearchForCart'>;

export default function PartSearchForCartScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(mockProducts);
  const cartCount = useCartStore((s) => s.lines.length);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setResults(mockProducts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())));
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]);

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
          <Box
            padding="md"
            background="surface"
            radius="md"
            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Stack direction="row" align="center" gap="md" style={{ flex: 1 }}>
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
            </Stack>
            <Pressable
              onPress={() =>
                navigation.navigate('CartQuantity', {
                  productId: item.id,
                  productName: item.name,
                  qrCode: item.qrCode,
                })
              }
              background="blue"
              radius="md"
              accessibilityLabel={`${item.name} ekle`}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </Pressable>
          </Box>
        )}
        ListEmptyComponent={<EmptyState title="Sonuç bulunamadı" icon="search-outline" />}
      />
      {cartCount > 0 && (
        <Box style={{ marginTop: spacing.md }}>
          <Button
            label={`Sepete Git (${cartCount})`}
            onPress={() => navigation.navigate('MaterialRequestCart')}
          />
        </Box>
      )}
    </Box>
  );
}