// src/screens/uretim-yoneticisi/ProductSearchScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
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
import { getProductByQrCode } from '../../api/products';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'ProductSearch'>;
type Rt = RouteProp<UretimYoneticisiStackParamList, 'ProductSearch'>;

const MIN_CODE_LENGTH = 4; // "MPS" + en az 1 karakter — anlamsız her tuş vuruşunda arama yapmayalım

export default function ProductSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Product | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Envanterde 7.000'i aşkın kalem olduğu için TÜM listeyi çekip ekranda
  // filtrelemek yerine (eskiden öyleydi, performans sorunu yaratıyordu),
  // kullanıcı kodun TAMAMINI yazınca (örn. "MPS-001") tek bir arama isteği
  // atıyoruz — QR okutmayla aynı PROCESS_QR komutu, sonuç tek ürün.
  useEffect(() => {
    const code = query.trim();
    if (code.length < MIN_CODE_LENGTH) {
      setResult(null);
      setMismatch(false);
      setSearched(false);
      return;
    }
    let ignore = false;
    const timeout = setTimeout(() => {
      setSearching(true);
      getProductByQrCode(code).then((product) => {
        if (ignore) return;
        // Kısıtlayıcı mod: departman seçim ekranında seçilen departmana ait
        // olmayan bir ürün, bu akışta "bulunamadı" sayılır (bkz. QRScanScreen
        // dosya başı notu — aynı kural QR okutmada da geçerli).
        if (product && product.departmentId && product.departmentId !== route.params.departmentId) {
          setResult(null);
          setMismatch(true);
        } else {
          setResult(product ?? null);
          setMismatch(false);
        }
        setSearched(true);
        setSearching(false);
      });
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [query, route.params.departmentId]);

  const results = result ? [result] : [];

  const handleSelect = (product: Product) => {
    navigation.replace('QRScan', {
      departmentId: route.params.departmentId,
      departmentName: route.params.departmentName,
      preselectedProduct: product,
    });
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
          <Box style={{ flex: 1 }}>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {route.params.departmentName.toUpperCase()}
            </Text>
            <Text variant="h2" color="white">
              Ürün Ara
            </Text>
          </Box>
        </Stack>
        <TextField
          icon="search-outline"
          placeholder="Ürün kodunu tam olarak girin (örn. MPS-001)"
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </Box>

      {searching ? (
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
            mismatch ? (
              <EmptyState
                title="Bu departmana ait değil"
                description={`Bu ürün "${route.params.departmentName}" departmanına ait değil.`}
                icon="alert-circle-outline"
              />
            ) : searched ? (
              <EmptyState
                title="Sonuç bulunamadı"
                description="Bu koda kayıtlı bir ürün yok — kodu kontrol edip tekrar deneyin"
                icon="search-outline"
              />
            ) : (
              <EmptyState
                title="Ürün kodunu girin"
                description="Etiket üzerindeki tam kodu (örn. MPS-001) yazınca ürün burada görünecek"
                icon="barcode-outline"
              />
            )
          }
        />
      )}
    </Box>
  );
}