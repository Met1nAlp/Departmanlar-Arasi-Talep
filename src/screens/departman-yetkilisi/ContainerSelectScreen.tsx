import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useContainerSelectionStore } from '../../store/containerSelectionStore';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'ContainerSelect'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'ContainerSelect'>;

export default function ContainerSelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const setSelection = useContainerSelectionStore((s) => s.setSelection);

  const [types, setTypes] = useState<ContainerType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getContainerTypes().then((data) => {
      setTypes(data);
      setSelected(data[0]?.id ?? null);
    });
  }, []);

  if (types.length === 0) return <LoadingView />;

  const handleConfirm = () => {
    if (!selected) return;
    setSelection(route.params.requestId, selected);
    navigation.goBack();
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        Taşıma için kap/palet tipi seçin
      </Text>
      <Stack gap="sm">
        {types.map((type) => {
          const isSelected = selected === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => setSelected(type.id)}
              background={isSelected ? 'blueLight' : 'surface'}
              radius="md"
              style={{
                width: '100%',
                paddingHorizontal: spacing.md,
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.blue,
              }}
            >
              <Stack direction="row" align="center" gap="sm" style={{ flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: isSelected ? colors.blue : colors.white,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="cube-outline" size={20} color={isSelected ? colors.white : colors.textMuted} />
                </View>
                <Stack gap="xs">
                  <Text variant="bodyBold">{type.code}</Text>
                  <Text variant="caption" color="textMuted">
                    Kapasite: {type.capacity} adet · Maks. {type.maxWeightKg} kg
                  </Text>
                </Stack>
              </Stack>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.blue} />}
            </Pressable>
          );
        })}
      </Stack>
      <Box style={{ marginTop: spacing.xl }}>
        <Button label="Seç" onPress={handleConfirm} disabled={!selected} />
      </Box>
    </Box>
  );
}