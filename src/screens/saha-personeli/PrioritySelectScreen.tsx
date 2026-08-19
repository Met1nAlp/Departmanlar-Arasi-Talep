import { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { spacing, colors } from '../../design-system/tokens';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'PrioritySelect'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'PrioritySelect'>;

const priorityOptions: { value: Priority; description: string }[] = [
  { value: 'LINE_DOWN', description: 'Üretim hattı durdu, acil müdahale gerekli' },
  { value: 'URGENT', description: 'Kısa sürede karşılanmalı' },
  { value: 'NORMAL', description: 'Standart öncelik' },
  { value: 'PLANNED', description: 'Zamana bağlı değil, planlı tedarik' },
];

export default function PrioritySelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [selected, setSelected] = useState<Priority>('NORMAL');

  const handleContinue = () => {
    navigation.navigate('DepartmentSelect', { priority: selected });
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        Bu talebin önceliği nedir?
      </Text>
      <Stack gap="sm">
        {priorityOptions.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              background="surface"
              radius="md"
              style={{
                width: '100%',
                paddingHorizontal: spacing.md,
                justifyContent: 'flex-start',
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.blue,
              }}
            >
              <Stack gap="xs" style={{ width: '100%' }}>
                <PriorityBadge priority={opt.value} />
                <Text variant="caption" color="textSecondary">
                  {opt.description}
                </Text>
              </Stack>
            </Pressable>
          );
        })}
      </Stack>
      <Box style={{ marginTop: spacing.xl }}>
        <Button label="Devam Et" onPress={handleContinue} />
      </Box>
    </Box>
  );
}