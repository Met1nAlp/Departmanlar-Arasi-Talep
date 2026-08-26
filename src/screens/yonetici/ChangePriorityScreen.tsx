import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { YoneticiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { spacing, colors } from '../../design-system/tokens';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'ChangePriority'>;
type Rt = RouteProp<YoneticiStackParamList, 'ChangePriority'>;

const priorityOptions: { value: Priority; description: string; slaLabel: string }[] = [
  { value: 'ACIL', description: 'Kuyruğun başına alınır', slaLabel: 'SLA 15 dk' },
  { value: 'NORMAL', description: 'Standart kuyruk', slaLabel: 'SLA 60 dk' },
];
export default function ChangePriorityScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const [selected, setSelected] = useState<Priority>('NORMAL');
  const [header, setHeader] = useState<{ requestId: string; productName: string } | null>(null);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      const [product] = await getProductsByIds([req.productId]);
      setHeader({ requestId: req.id, productName: product?.name ?? '' });
    });
  }, [route.params.requestId]);

  const handleSave = () => {
    // ÖNEMLİ: Request tipinde priority alanı henüz yok (Efe'nin E1 maddesi).
    // Gerçek bir güncelleme API'si olmadığı için şimdilik konsola yazıp geri dönüyoruz.
    // Efe'nin tipleri gelince: updateRequestPriority(route.params.requestId, selected)
    console.log('Öncelik değiştirildi:', { requestId: route.params.requestId, newPriority: selected });
    navigation.goBack();
  };

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box>
            <Text variant="h2" color="white">
              Yeni öncelik seçin
            </Text>
            {header && (
              <Text variant="caption" color="white" style={{ opacity: 0.75 }}>
                {header.requestId.toUpperCase()} · {header.productName}
              </Text>
            )}
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Stack direction="row" justify="space-between" align="center" style={{ marginBottom: spacing.md }}>
          <Text variant="body" color="textSecondary">
            Mevcut öncelik
          </Text>
          <PriorityBadge priority="NORMAL" />
        </Stack>

        <Stack gap="sm">
          {priorityOptions.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                background="white"
                radius="md"
                style={{
                  width: '100%',
                  padding: spacing.md,
                  justifyContent: 'flex-start',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.blue : colors.border,
                }}
              >
                <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                  <Stack gap="xs">
                    <PriorityBadge priority={opt.value} />
                    <Text variant="caption" color="textSecondary">
                      {opt.description}
                      {opt.slaLabel ? ` · ${opt.slaLabel}` : ''}
                    </Text>
                  </Stack>
                  {isSelected ? (
                    <Box
                      background="blue"
                      style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </Box>
                  ) : (
                    <Box style={{ width: 24, height: 24, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border }} />
                  )}
                </Stack>
              </Pressable>
            );
          })}
        </Stack>

        <Box
          background="warningLight"
          radius="md"
          padding="md"
          style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'flex-start' }}
        >
          <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
          <Text variant="caption" color="warning" style={{ marginLeft: spacing.sm, flex: 1 }}>
            Değişiklik denetim kaydına yazılır.
          </Text>
        </Box>
      </Box>

      <Box padding="md" style={{ paddingTop: 0, paddingBottom: insets.bottom + spacing.md }}>
        <Button label="Önceliği Güncelle" onPress={handleSave} />
      </Box>
    </Box>
  );
}
