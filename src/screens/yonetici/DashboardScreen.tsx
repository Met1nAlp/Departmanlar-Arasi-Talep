// src/screens/yonetici/DashboardScreen.tsx — "Vardiya Özeti" mockup'ı
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { YoneticiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getDashboardStats } from '../../api/stats';
import type { DashboardStat } from '../../mocks/stats';

type Nav = NativeStackNavigationProp<YoneticiStackParamList, 'Dashboard'>;

const toneColor: Record<DashboardStat['tone'], { fg: string; bg: string }> = {
  pending: { fg: colors.statePending, bg: colors.blueLight },
  success: { fg: colors.stateSuccess, bg: colors.stateSuccessBg },
  danger: { fg: colors.stateDanger, bg: colors.stateDangerBg },
  neutral: { fg: colors.stateNeutral, bg: colors.stateNeutralBg },
};

// "Kişisel İletişim" kısayolları — mockup'taki Eskalasyon Listesi / Vardiya
// Raporu / Personel Yükü satırları. Vardiya Raporu ve Personel Yükü henüz
// ayrı ekran değil (Plan §17.2'de ⚠️ MVP-sonu işaretli), bu yüzden şimdilik
// yalnızca Eskalasyon Listesi gerçek bir navigasyona bağlı.
export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Ionicons
          name="settings-outline"
          size={24}
          color={colors.white}
          style={{ marginRight: spacing.md }}
          onPress={() => navigation.navigate('Settings')}
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingView />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ padding: spacing.md }}>
      <Text variant="bodyBold" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        VARDİYA ÖZETİ
      </Text>

      <Stack direction="row" wrap gap="sm" style={{ marginBottom: spacing.lg }}>
        {stats.map((stat) => {
          const tone = toneColor[stat.tone];
          return (
            <Box
              key={stat.label}
              padding="md"
              background="surface"
              radius="md"
              border
              style={{ width: '47%' }}
            >
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: tone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <Ionicons name={stat.icon as any} size={18} color={tone.fg} />
              </Box>
              <Text variant="h1" style={{ color: tone.fg }}>
                {stat.value}
              </Text>
              <Text variant="caption" color="textSecondary">
                {stat.label}
              </Text>
            </Box>
          );
        })}
      </Stack>

      <Text variant="bodyBold" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        KİŞİSEL İLETİŞİM
      </Text>
      <Stack gap="sm">
        <QuickLink
          icon="warning-outline"
          label="Eskalasyon Listesi"
          onPress={() => navigation.navigate('EscalationList')}
        />
        <QuickLink icon="document-text-outline" label="Vardiya Raporu" onPress={() => {}} disabled />
        <QuickLink icon="people-outline" label="Personel Yükü" onPress={() => {}} disabled />
      </Stack>
    </ScrollView>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      background="surface"
      radius="md"
      style={{
        width: '100%',
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons name={icon as any} size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}
