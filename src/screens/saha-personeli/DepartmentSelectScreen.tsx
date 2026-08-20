// src/screens/saha-personeli/DepartmentSelectScreen.tsx
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { Button } from '../../design-system/components/Button';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { colors, spacing } from '../../design-system/tokens';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DepartmentSelect'>;

const priorityOptions: { value: Priority; description: string }[] = [
  { value: 'LINE_DOWN', description: 'Üretim hattı durdu, acil müdahale gerekli' },
  { value: 'URGENT', description: 'Kısa sürede karşılanmalı' },
  { value: 'NORMAL', description: 'Standart öncelik' },
  { value: 'PLANNED', description: 'Zamana bağlı değil, planlı tedarik' },
];

export default function DepartmentSelectScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>('NORMAL');

  useEffect(() => {
    getDepartments().then((deps) => {
      setDepartments(deps);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingView />;

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
            <Text variant="h2">Departman ve Öncelik</Text>
            <Text variant="caption" color="textMuted">
              Adım 1/2 · Yeni talep
            </Text>
          </Box>
        </Stack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}>
        <Text variant="h2">Bu talebin önceliği nedir?</Text>
        <Stack direction="row" wrap gap="sm" style={{ marginTop: spacing.sm }}>
          {priorityOptions.map((opt) => {
            const isSelected = priority === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                background="white"
                radius="md"
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.blue : colors.border,
                }}
                accessibilityLabel={opt.value}
                accessibilityState={{ selected: isSelected }}
              >
                <PriorityBadge priority={opt.value} />
              </Pressable>
            );
          })}
        </Stack>
        <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
          {priorityOptions.find((opt) => opt.value === priority)?.description}
        </Text>

        <Text variant="h2">Hangi departmandan talep edilecek?</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          Parça, seçtiğiniz departmanın kuyruğuna düşer.
        </Text>

        {departments.map((dep) => {
          const selected = dep.id === selectedId;
          return (
            <Pressable
              key={dep.id}
              onPress={() => setSelectedId(dep.id)}
              background="white"
              radius="md"
              style={{
                width: '100%',
                marginBottom: spacing.sm,
                padding: spacing.md,
                justifyContent: 'flex-start',
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.blue : colors.border,
              }}
              accessibilityLabel={dep.name}
              accessibilityState={{ selected }}
            >
              <Stack direction="row" align="center" justify="space-between" style={{ width: '100%' }}>
                <Stack direction="row" align="center" gap="md">
                  <Box
                    background={selected ? 'blue' : 'blueLight'}
                    radius="md"
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="business-outline" size={22} color={selected ? colors.white : colors.blue} />
                  </Box>
                  <Text variant="bodyBold">{dep.name}</Text>
                </Stack>
                {selected ? (
                  <Box
                    background="blue"
                    style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </Box>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                )}
              </Stack>
            </Pressable>
          );
        })}
      </ScrollView>

      <Box padding="md">
        <Button
          label="Devam Et"
          onPress={() => selectedId && navigation.navigate('QRScan', { departmentId: selectedId })}
          disabled={!selectedId}
        />
      </Box>
    </Box>
  );
}
