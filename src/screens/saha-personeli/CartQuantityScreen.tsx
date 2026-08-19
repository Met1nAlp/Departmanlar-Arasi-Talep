// src/screens/saha-personeli/CartQuantityScreen.tsx
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { NumericKeypad } from '../../design-system/components/NumericKeypad';
import { colors, spacing } from '../../design-system/tokens';
import { useCartStore } from '../../store/cartStore';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'CartQuantity'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'CartQuantity'>;

export default function CartQuantityScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const { productId, productName, qrCode } = route.params;
  const addLine = useCartStore((s) => s.addLine);
  const [quantity, setQuantity] = useState('');

  const handleContinue = () => {
    if (quantity === '' || Number(quantity) <= 0) return;
    addLine(productId, productName, Number(quantity));
    navigation.goBack();
  };

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="white"
        border
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable
            onPress={() => navigation.goBack()}
            background="surface"
            radius="md"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Box>
            <Text variant="h2">Adet Girin</Text>
            <Text variant="caption" color="textMuted">
              Yeni talep · Ürün ekle
            </Text>
          </Box>
        </Stack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}>
        <Box padding="md" background="surface" radius="md" style={{ marginBottom: spacing.lg }}>
          <Stack direction="row" align="center" gap="md">
            <Box
              background="blueLight"
              radius="md"
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="cube-outline" size={22} color={colors.blue} />
            </Box>
            <Box>
              <Text variant="bodyBold">{productName}</Text>
              <Text variant="caption" color="textMuted">
                {qrCode}
              </Text>
            </Box>
          </Stack>
        </Box>

        <Text variant="caption" color="textMuted" style={{ textAlign: 'center', letterSpacing: 1 }}>
          TALEP EDİLEN ADET
        </Text>
        <Stack direction="row" align="baseline" justify="center" style={{ marginVertical: spacing.md }}>
          <Text variant="h1" color="blue" style={{ fontSize: 56, minHeight: 56 }}>
            {quantity || '0'}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginLeft: spacing.xs }}>
            adet
          </Text>
        </Stack>

        <NumericKeypad value={quantity} onChange={setQuantity} maxLength={4} />
      </ScrollView>

      <Box padding="md" style={{ paddingTop: 0 }}>
        <Button
          label="Devam Et"
          onPress={handleContinue}
          disabled={quantity === '' || Number(quantity) <= 0}
        />
      </Box>
    </Box>
  );
}
