import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { ContainerType } from '../../contracts/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing, colors } from '../../design-system/tokens';
import { getContainerTypes } from '../../api/containerTypes';
import { getMaterialRequestById } from '../../api/materialRequests';
import { useContainerSelectionStore } from '../../store/containerSelectionStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'ContainerSelect'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'ContainerSelect'>;

export default function ContainerSelectScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const setSelection = useContainerSelectionStore((s) => s.setSelection);

  const [types, setTypes] = useState<ContainerType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ requestNo: string; lineCount: number; totalQty: number } | null>(null);

  useEffect(() => {
    getContainerTypes().then((data) => {
      setTypes(data);
      setSelected(data[0]?.id ?? null);
    });
    getMaterialRequestById(route.params.requestId).then((req) => {
      if (!req) return;
      setSummary({
        requestNo: req.requestNo,
        lineCount: req.lines.length,
        totalQty: req.lines.reduce((sum, l) => sum + l.qtyRequested, 0),
      });
    });
  }, [route.params.requestId]);

  if (types.length === 0) return <LoadingView />;

  const selectedType = types.find((t) => t.id === selected);
  const suggestedCount = selectedType && summary ? Math.ceil(summary.totalQty / selectedType.capacity) : null;

  const handleConfirm = () => {
    if (!selected) return;
    setSelection(route.params.requestId, selected);
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
          <Pressable onPress={() => navigation.goBack()} background="surface" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Box>
            <Text variant="h2">Taşıma Birimi Seçin</Text>
            {summary && (
              <Text variant="caption" color="textMuted">
                {summary.requestNo} · {summary.lineCount} kalem · {summary.totalQty} adet
              </Text>
            )}
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Stack gap="sm">
          {types.map((type) => {
            const isSelected = selected === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setSelected(type.id)}
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
                <Stack direction="row" align="center" justify="space-between" style={{ width: '100%' }}>
                  <Stack direction="row" align="center" gap="md" style={{ flex: 1 }}>
                    <Box
                      background={isSelected ? 'blue' : 'blueLight'}
                      radius="md"
                      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="cube-outline" size={22} color={isSelected ? colors.white : colors.blue} />
                    </Box>
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text variant="bodyBold">{type.code}</Text>
                      <Text variant="caption" color="textMuted">
                        {type.capacity} adet kapasiteli · Maks. {type.maxWeightKg} kg
                      </Text>
                    </Stack>
                  </Stack>
                  {isSelected ? (
                    <Box
                      background="blue"
                      style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </Box>
                  ) : (
                    <Box
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: colors.border,
                      }}
                    />
                  )}
                </Stack>
              </Pressable>
            );
          })}
        </Stack>

        {suggestedCount !== null && selectedType && (
          <Box
            background="blueLight"
            radius="md"
            padding="md"
            style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
            <Text variant="caption" color="blueDark" style={{ marginLeft: spacing.sm, flex: 1 }}>
              {summary?.totalQty} adet için {suggestedCount} × {selectedType.code} öneriliyor.
            </Text>
          </Box>
        )}
      </Box>

      <Box padding="md" style={{ paddingTop: 0 }}>
        <Button label="Kap Etiketini Yazdır" onPress={handleConfirm} disabled={!selected} />
      </Box>
    </Box>
  );
}
