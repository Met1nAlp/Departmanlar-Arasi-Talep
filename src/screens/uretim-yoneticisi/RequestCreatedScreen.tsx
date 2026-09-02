// src/screens/uretim-yoneticisi/RequestCreatedScreen.tsx
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing } from '../../design-system/tokens';
import { getDepartments } from '../../api/departments';
import { scale } from '../../design-system/tokens/scale';
import { successFeedback } from '../../design-system/feedback';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'RequestCreated'>;
type Rt = RouteProp<UretimYoneticisiStackParamList, 'RequestCreated'>;

interface DepartmentGroup {
  departmentId: string;
  departmentName: string;
  items: { partId: string; partName: string; qty: number }[];
}

export default function RequestCreatedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const [groups, setGroups] = useState<DepartmentGroup[] | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const departments = await getDepartments();
      if (cancelled) return;

      const resolved = route.params.groups.map((group) => ({
        departmentId: group.departmentId,
        departmentName: departments.find((d) => d.id === group.departmentId)?.name ?? group.departmentId,
        items: group.items,
      }));
      setGroups(resolved);
      // Özet ekranında sepet ekranının aksine varsayılan olarak hepsi açık —
      // gönderdiği şeyi bir kere görüp kapatmak, açıp aramaktan daha az sürtünme.
      setExpandedDepartments(new Set(resolved.map((g) => g.departmentId)));
      void successFeedback();
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [route.params.groups]);

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  };

  const goHome = () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));

  if (!groups) return <LoadingView />;

  const itemCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  const totalQty = groups.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.qty, 0), 0);

  return (
    <Box
      style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
      background="white"
      paddingHorizontal="lg"
    >
      <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Box
          background="blue"
          style={{ width: scale(72), height: scale(72), borderRadius: scale(999), alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </Box>
        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {itemCount > 1 ? 'Talepleriniz oluşturuldu' : 'Talebiniz oluşturuldu'}
        </Text>
        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
          {groups.length === 1
            ? `${groups[0].departmentName} ekibi bilgilendirildi. `
            : `${groups.length} departman bilgilendirildi. `}
          Durum değiştikçe cihazınıza bildirim gelecek.
        </Text>

        <Box style={{ width: '100%', marginTop: spacing.xl }}>
          <Stack gap="xs">
            {groups.map((group) => {
              const expanded = expandedDepartments.has(group.departmentId);
              const groupQty = group.items.reduce((sum, item) => sum + item.qty, 0);
              return (
                <Box key={group.departmentId} background="surface" radius="md" style={{ overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => toggleDepartment(group.departmentId)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                    accessibilityLabel={`${group.departmentName} kalemlerini ${expanded ? 'gizle' : 'göster'}`}
                  >
                    <Stack direction="row" align="center" gap="sm" style={{ flex: 1, marginRight: spacing.sm }}>
                      <Ionicons name="business-outline" size={scale(16)} color={colors.blue} />
                      <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
                        {group.departmentName}
                      </Text>
                    </Stack>
                    <Stack direction="row" align="center" gap="xs">
                      <Text variant="caption" color="textMuted">
                        {group.items.length} kalem · {groupQty} adet
                      </Text>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={scale(16)} color={colors.textMuted} />
                    </Stack>
                  </Pressable>

                  {expanded && (
                    <Box style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
                      <Box style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.xs }} />
                      <Stack gap="xs">
                        {group.items.map((item) => (
                          <Stack key={item.partId} direction="row" justify="space-between" align="center">
                            <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                              {item.partName}
                            </Text>
                            <Text variant="bodyBold" color="textSecondary">
                              × {item.qty}
                            </Text>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Stack>

      <Box>
        <Button label="Ana Ekrana Dön" onPress={goHome} />
        {itemCount === 1 && route.params.requestIds[0] && (
          <Button
            label="Talebi Görüntüle"
            onPress={() => navigation.navigate('RequestTracking', { requestId: route.params.requestIds[0] })}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </Box>
    </Box>
  );
}
