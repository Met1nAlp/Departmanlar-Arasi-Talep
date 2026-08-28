// src/screens/yonetici/DashboardScreen.tsx
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request, Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { getRequests } from '../../api/requests';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    Promise.all([getRequests({}), getDepartments()]).then(([reqs, deps]) => {
      setRequests(reqs);
      setDepartments(deps);
    });
  }, []);

  if (!requests) return <LoadingView />;

  const isTerminal = (r: Request) => r.status === 'IPTAL_EDILDI' || r.status === 'REDDEDILDI';
  const activeRequests = requests.filter((r) => r.status !== 'TESLIM_EDILDI' && !isTerminal(r));
  const onTheWayCount = activeRequests.filter((r) => r.status === 'YOLDA').length;
  const waitingCount = activeRequests.length - onTheWayCount;

  const readyDurations = requests
    .filter((r) => r.readyAt)
    .map((r) => (new Date(r.readyAt!).getTime() - new Date(r.createdAt).getTime()) / 60000);
  const avgReadyMinutes = readyDurations.length
    ? Math.round(readyDurations.reduce((sum, m) => sum + m, 0) / readyDurations.length)
    : null;

  const departmentBreakdown = departments
    .map((dep) => ({
      name: dep.name,
      count: activeRequests.filter((r) => r.departmentId === dep.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxDeptCount = Math.max(...departmentBreakdown.map((d) => d.count), 1);

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
        <Stack direction="row" justify="space-between" align="center">
          <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
            MEPSAN · YÖNETİM
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            background="blueMedium"
            style={{
              borderRadius: 999,
              width: scale(38),
              height: scale(38),
              minWidth: scale(38),
              minHeight: scale(38),
            }}
            accessibilityLabel="Ayarlar"
          >
            <Ionicons name="settings-outline" size={scale(18)} color={colors.white} />
          </Pressable>
        </Stack>
        <Text variant="h1" color="white" style={{ marginTop: spacing.xs }}>
          Vardiya Özeti
        </Text>
      </Box>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg }}>
        <Stack direction="row" gap="sm">
          <StatCard
            icon="file-tray-outline"
            label="Açık talep"
            value={String(activeRequests.length)}
            note={`${waitingCount} bekleyen · ${onTheWayCount} yolda`}
          />
          <StatCard
            icon="time-outline"
            label="Ort. karşılama"
            value={avgReadyMinutes !== null ? String(avgReadyMinutes) : '—'}
            unit={avgReadyMinutes !== null ? 'dk' : undefined}
            note={avgReadyMinutes !== null ? undefined : 'Henüz veri yok'}
          />
        </Stack>

        {departmentBreakdown.length > 0 && (
          <>
            <Text
              variant="caption"
              color="textMuted"
              style={{ letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm }}
            >
              DEPARTMANA GÖRE AÇIK TALEP
            </Text>
            <Box background="surface" radius="md" padding="md">
              <Stack gap="md">
                {departmentBreakdown.map((dep) => (
                  <Box key={dep.name}>
                    <Stack direction="row" justify="space-between" style={{ marginBottom: 6 }}>
                      <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                        {dep.name}
                      </Text>
                      <Text variant="bodyBold" color="blue">
                        {dep.count}
                      </Text>
                    </Stack>
                    <Box style={{ height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
                      <Box
                        background="blue"
                        style={{ height: '100%', width: `${(dep.count / maxDeptCount) * 100}%`, borderRadius: 999 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}

        <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          HIZLI ERİŞİM
        </Text>
        <Stack gap="sm">
          <QuickAccessCard
            icon="warning-outline"
            iconColor="danger"
            title="Eskalasyon Listesi"
            subtitle="Süresi dolan bekleyen talepler"
            onPress={() => navigation.navigate('EscalationList')}
          />
          <QuickAccessCard
            icon="bar-chart-outline"
            iconColor="blue"
            title="Departman Raporu"
            subtitle={`Toplam ${requests.length} talep`}
            onPress={() => navigation.navigate('DepartmentReports')}
          />
        </Stack>
      </ScrollView>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
}) {
  return (
    <Box background="surface" radius="md" padding="md" style={{ flex: 1 }}>
      <Stack direction="row" align="center" gap="xs">
        <Ionicons name={icon as any} size={scale(16)} color={colors.textMuted} />
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </Stack>
      <Stack direction="row" align="baseline" gap="xs" style={{ marginTop: spacing.xs }}>
        <Text variant="h1">{value}</Text>
        {unit && (
          <Text variant="body" color="textMuted">
            {unit}
          </Text>
        )}
      </Stack>
      {note && (
        <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
          {note}
        </Text>
      )}
    </Box>
  );
}

function QuickAccessCard({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  iconColor: keyof typeof colors;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      background="surface"
      radius="md"
      style={{ width: '100%', padding: spacing.md, justifyContent: 'flex-start' }}
    >
      <Stack direction="row" align="center" gap="md" style={{ width: '100%' }}>
        <Box
          background={iconColor === 'danger' ? 'dangerLight' : 'blueLight'}
          radius="md"
          style={{ width: scale(44), height: scale(44), alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={icon as any} size={scale(22)} color={colors[iconColor]} />
        </Box>
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text variant="bodyBold">{title}</Text>
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        </Stack>
        <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
      </Stack>
    </Pressable>
  );
}