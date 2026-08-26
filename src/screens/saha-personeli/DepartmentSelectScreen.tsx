// src/screens/saha-personeli/DepartmentSelectScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { scale } from '../../design-system/tokens/scale';
import { getDepartments } from '../../api/departments';
import { useCartStore } from '../../store/cartStore';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DepartmentSelect'>;

const priorityOptions: { value: Priority; description: string }[] = [
  { value: 'ACIL', description: 'Kısa sürede karşılanmalı' },
  { value: 'NORMAL', description: 'Standart öncelik' },
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

  const clearCart = useCartStore((s) => s.clear);
  useFocusEffect(
    useCallback(() => {
      clearCart();
    }, [clearCart])
  );

  if (loading) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }}
      >
        <Stack direction="row" align="center" gap="sm">
          <Pressable
            onPress={() => navigation.goBack()}
            background="blueMedium"
            radius="md"
            style={{ width: scale(44), height: scale(44), minWidth: scale(44), minHeight: scale(44) }}
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box>
            <Text variant="h2" color="white">
              Yeni Talep
            </Text>
            <Text variant="caption" color="white" style={{ opacity: 0.75 }}>
              Adım 1/2 · Departman ve öncelik
            </Text>
          </Box>
        </Stack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}>
        <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginBottom: spacing.xs }}>
          ÖNCELİK
        </Text>
        <Stack direction="row" gap="sm">
          {priorityOptions.map((opt) => {
            const isSelected = priority === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                background="white"
                radius="md"
                style={{
                  flex: 1,
                  paddingVertical: spacing.xs,
                  minHeight: undefined,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.blue : colors.border,
                }}
                accessibilityLabel={opt.value}
                accessibilityState={{ selected: isSelected }}
              >
                <Stack style={{ alignItems: 'center' }}>
                  <PriorityBadge priority={opt.value} />
                </Stack>
              </Pressable>
            );
          })}
        </Stack>
        <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
          {priorityOptions.find((opt) => opt.value === priority)?.description}
        </Text>

        <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginBottom: spacing.xs }}>
          DEPARTMAN
        </Text>

        <Stack gap="xs">
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
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  minHeight: scale(56),
                  justifyContent: 'center',
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.blue : colors.border,
                }}
                accessibilityLabel={dep.name}
                accessibilityState={{ selected }}
              >
                <Stack direction="row" align="center" justify="space-between" style={{ width: '100%' }}>
                  <Stack direction="row" align="center" gap="sm" style={{ flex: 1 }}>
                    <Box
                      background={selected ? 'blue' : 'blueLight'}
                      radius="md"
                      style={{
                        width: scale(32),
                        height: scale(32),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="business-outline" size={16} color={selected ? colors.white : colors.blue} />
                    </Box>
                    <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {dep.name}
                    </Text>
                  </Stack>
                  {selected ? (
                    <Box
                      background="blue"
                      style={{
                        width: scale(20),
                        height: scale(20),
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={13} color={colors.white} />
                    </Box>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  )}
                </Stack>
              </Pressable>
            );
          })}
        </Stack>
      </ScrollView>

      <Box padding="md" style={{ paddingTop: 0, paddingBottom: insets.bottom + spacing.md }}>
        <Button
          label="Devam Et"
          onPress={() => selectedId && navigation.navigate('QRScan', { departmentId: selectedId, priority })}
          disabled={!selectedId}
        />
      </Box>
    </Box>
  );
}