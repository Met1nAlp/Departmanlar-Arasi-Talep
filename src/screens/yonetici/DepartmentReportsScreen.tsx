// src/screens/yonetici/DepartmentReportsScreen.tsx
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getDepartmentStats } from '../../api/stats';

const rankColors = ['blue', 'blueMedium', 'textMuted'] as const;

export default function DepartmentReportsScreen() {
  const insets = useSafeAreaInsets();
  const [departmentStats, setDepartmentStats] = useState<{ name: string; requestCount: number }[] | null>(null);

  useEffect(() => {
    getDepartmentStats().then(setDepartmentStats);
  }, []);

  if (!departmentStats) return <LoadingView />;

  const totalCount = departmentStats.reduce((sum, d) => sum + d.requestCount, 0);
  const maxCount = Math.max(...departmentStats.map((d) => d.requestCount), 1);
  const sorted = [...departmentStats].sort((a, b) => b.requestCount - a.requestCount);

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      >
        <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
          MTS · YÖNETİM
        </Text>
        <Text variant="h2" color="white" style={{ marginTop: spacing.xs }}>
          Departman Raporu
        </Text>
        <Text variant="body" color="white" style={{ opacity: 0.85, marginTop: spacing.xs }}>
          Toplam {totalCount} talep · {departmentStats.length} departman
        </Text>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
        {sorted.length === 0 ? (
          <EmptyState title="Veri yok" description="Henüz kayıtlı talep bulunmuyor" icon="bar-chart-outline" />
        ) : (
          sorted.map((d, index) => {
            const percentage = totalCount > 0 ? Math.round((d.requestCount / totalCount) * 100) : 0;
            return (
              <Box key={d.name} background="surface" radius="md" padding="md">
                <Stack direction="row" align="center" gap="md">
                  <Box
                    background="white"
                    radius="md"
                    style={{
                      width: 36,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text variant="bodyBold" color="textSecondary">
                      {index + 1}
                    </Text>
                  </Box>
                  <Stack style={{ flex: 1 }}>
                    <Text variant="bodyBold" numberOfLines={1}>
                      {d.name}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      %{percentage} · toplam talebin
                    </Text>
                  </Stack>
                  <Text variant="h2" color="blue">
                    {d.requestCount}
                  </Text>
                </Stack>
                <Box background="white" radius="sm" style={{ height: 6, marginTop: spacing.md, overflow: 'hidden' }}>
                  <Box
                    background="blue"
                    radius="sm"
                    style={{ height: '100%', width: `${(d.requestCount / maxCount) * 100}%` }}
                  />
                </Box>
              </Box>
            );
          })
        )}
      </ScrollView>
    </Box>
  );
}