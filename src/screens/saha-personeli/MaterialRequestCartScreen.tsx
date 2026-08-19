import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Priority } from '../../contracts/types';
import { Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { PriorityBadge } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { spacing, colors } from '../../design-system/tokens';
import { useCartStore } from '../../store/cartStore';
import { useActiveUser } from '../../store/authStore';
import { getDepartments } from '../../api/departments';
import { createMaterialRequest } from '../../api/materialRequests';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'MaterialRequestCart'>;

const priorityOptions: Priority[] = ['LINE_DOWN', 'URGENT', 'NORMAL', 'PLANNED'];

export default function MaterialRequestCartScreen() {
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const { lines, updateQty, removeLine, clear } = useCartStore();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  const canSubmit = lines.length > 0 && selectedDept !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !selectedDept) return;
    setSubmitting(true);
    const newRequest = await createMaterialRequest({
      requesterUserId: user.id,
      // GEÇİCİ: prototipte saha personelinin "kendi departmanı" kavramı henüz yok
      // (Efe'nin UserRoleAssignment modeli gelince buradan gerçek değer gelecek).
      requesterDeptId: 'dep-requester-placeholder',
      supplierDeptId: selectedDept.id,
      priority,
      lines: lines.map((l) => ({ partId: l.partId, qtyRequested: l.qtyRequested })),
    });
    clear();
    setSubmitting(false);
    navigation.navigate('RequestCreated', { requestId: newRequest.id });
  };

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Hangi departmandan talep ediyorsunuz?
      </Text>
      <Stack direction="row" gap="sm" wrap style={{ marginBottom: spacing.lg }}>
        {departments.map((dep) => {
          const isSelected = selectedDept?.id === dep.id;
          return (
            <Pressable
              key={dep.id}
              onPress={() => setSelectedDept(dep)}
              background={isSelected ? 'blue' : 'surface'}
              radius="md"
              style={{
                paddingHorizontal: spacing.md,
                minWidth: undefined,
                minHeight: 44,
                borderWidth: isSelected ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text variant="body" color={isSelected ? 'white' : 'textPrimary'}>
                {dep.name}
              </Text>
            </Pressable>
          );
        })}
      </Stack>

      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Öncelik
      </Text>
      <Stack direction="row" gap="sm" style={{ marginBottom: spacing.lg }}>
        {priorityOptions.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={{ minWidth: undefined, minHeight: undefined, opacity: priority === p ? 1 : 0.4 }}
          >
            <PriorityBadge priority={p} />
          </Pressable>
        ))}
      </Stack>

      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Ürünler ({lines.length})
      </Text>
      <FlatList
        data={lines}
        keyExtractor={(item) => item.partId}
        renderItem={({ item }) => (
          <Box padding="md" background="surface" radius="md" style={{ marginBottom: spacing.sm }}>
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="bodyBold" style={{ flex: 1 }}>
                {item.partName}
              </Text>
              <Pressable onPress={() => removeLine(item.partId)} style={{ minWidth: 32, minHeight: 32 }}>
                <Text variant="body" color="danger">
                  ✕
                </Text>
              </Pressable>
            </Stack>
            <Stack direction="row" align="center" gap="sm" style={{ marginTop: spacing.xs }}>
              <Pressable
                onPress={() => updateQty(item.partId, Math.max(1, item.qtyRequested - 1))}
                background="surface"
                radius="sm"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
              >
                <Text variant="body">−</Text>
              </Pressable>
              <Text variant="bodyBold">{item.qtyRequested}</Text>
              <Pressable
                onPress={() => updateQty(item.partId, item.qtyRequested + 1)}
                background="surface"
                radius="sm"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderWidth: 1, borderColor: colors.border }}
              >
                <Text variant="body">+</Text>
              </Pressable>
            </Stack>
          </Box>
        )}
        ListEmptyComponent={
          <EmptyState title="Sepet boş" description="Ürün eklemek için geri dönün" icon="cart-outline" />
        }
      />

      <View style={{ marginTop: spacing.md }}>
        <Button label="Ürün Ekle" onPress={() => navigation.navigate('PartSearchForCart')} variant="secondary" />
        <Button
          label="Talebi Gönder"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={submitting}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </Box>
  );
}