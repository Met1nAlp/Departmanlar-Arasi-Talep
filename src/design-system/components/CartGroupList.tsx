// src/design-system/components/CartGroupList.tsx
//
// Sepetteki eşyaların departmana göre gruplanmış, açılır-kapanır listesi.
// Hem QRScanScreen'in "Adet Girin" adımında hem de sepeti gözden geçirme
// modalinde (aynı ekran, tarama adımı) kullanılır — tek yerden bakım.

import { Ionicons } from '@expo/vector-icons';
import type { CartLine } from '../../store/cartStore';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { colors, spacing } from '../tokens';
import { scale } from '../tokens/scale';

interface Props {
  cartGroups: [string, CartLine[]][];
  departmentNames: Record<string, string>;
  expandedDepartments: Set<string>;
  onToggleDepartment: (departmentId: string) => void;
  onRemoveLine: (partId: string) => void;
}

export function CartGroupList({
  cartGroups,
  departmentNames,
  expandedDepartments,
  onToggleDepartment,
  onRemoveLine,
}: Props) {
  return (
    <Stack gap="xs">
      {cartGroups.map(([departmentId, lines]) => {
        const expanded = expandedDepartments.has(departmentId);
        const groupQty = lines.reduce((sum, line) => sum + line.qtyRequested, 0);
        return (
          <Box key={departmentId} background="surface" radius="md" style={{ overflow: 'hidden' }}>
            <Pressable
              onPress={() => onToggleDepartment(departmentId)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
              accessibilityLabel={`${departmentNames[departmentId] ?? departmentId} kalemlerini ${expanded ? 'gizle' : 'göster'}`}
            >
              <Stack direction="row" align="center" gap="sm" style={{ flex: 1, marginRight: spacing.sm }}>
                <Ionicons name="business-outline" size={scale(16)} color={colors.blue} />
                <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
                  {departmentNames[departmentId] ?? departmentId}
                </Text>
              </Stack>
              <Stack direction="row" align="center" gap="xs">
                <Text variant="caption" color="textMuted">
                  {lines.length} kalem · {groupQty} adet
                </Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={scale(16)} color={colors.textMuted} />
              </Stack>
            </Pressable>

            {expanded && (
              <Box style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
                <Box style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.xs }} />
                <Stack gap="xs">
                  {lines.map((line) => (
                    <Stack key={line.partId} direction="row" justify="space-between" align="center">
                      <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                        {line.partName} <Text variant="caption" color="textMuted">× {line.qtyRequested}</Text>
                      </Text>
                      <Pressable
                        onPress={() => onRemoveLine(line.partId)}
                        style={{ minWidth: scale(32), minHeight: scale(32) }}
                        accessibilityLabel={`${line.partName} sepetten çıkar`}
                      >
                        <Ionicons name="close" size={scale(18)} color={colors.danger} />
                      </Pressable>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
