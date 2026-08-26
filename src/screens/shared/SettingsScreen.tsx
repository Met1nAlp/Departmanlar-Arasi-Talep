import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors, radius } from '../../design-system/tokens';
import { useAuthStore, useActiveUser } from '../../store/authStore';
import { useDeviceStore } from '../../store/deviceStore';
import { getDepartments } from '../../api/departments';
import { scale } from '../../design-system/tokens/scale';

const roleLabels: Record<string, string> = {
  saha_personeli: 'Saha Personeli',
  departman_yetkilisi: 'Departman Yetkilisi',
  yonetici: 'Yönetici',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const logout = useAuthStore((s) => s.logout);
  const deviceUid = useDeviceStore((s) => s.deviceUid);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  const appVersion = Constants.expoConfig?.version ?? 'bilinmiyor';

  useEffect(() => {
    if (!user?.departmentId) return;
    getDepartments().then((departments) => {
      setDepartmentName(departments.find((d) => d.id === user.departmentId)?.name ?? '');
    });
  }, [user]);

  const handleLogoutConfirm = () => {
    setConfirmVisible(false);
    logout();
    // currentUser null olunca RootNavigator otomatik olarak AuthNavigator'a
    // döner, o da kart okutma ekranını gösterir — elle navigation.navigate
    // çağrısına gerek yok.
  };

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.lg,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
          position: 'relative',
        }}
      >
        <Stack direction="row" align="center" gap="md">
          {navigation.canGoBack() ? (
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityLabel="Geri"
              background="blueMedium"
              style={{ width: scale(56), height: scale(56), minWidth: scale(56), minHeight: scale(56), borderRadius: scale(999) }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </Pressable>
          ) : (
            <Box
              background="blueMedium"
              style={{ width: scale(56), height: scale(56), minWidth: scale(56), minHeight: scale(56), borderRadius: scale(999), alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="person" size={26} color={colors.white} />
            </Box>
          )}
          <Box>
            <Text variant="h1" color="white">
              {user?.name ?? '—'}
            </Text>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              {user ? roleLabels[user.role]?.toUpperCase() : '—'}
            </Text>
          </Box>
        </Stack>
      </Box>

            <Box padding="md" style={{ flex: 1, paddingBottom: insets.bottom + spacing.md }}>
        <Box background="surface" radius="md">
          <InfoRow label="Departman" value={departmentName || '—'} />
          <Divider />
          <InfoRow label="Cihaz" value={deviceUid ?? 'kayıtlı değil'} />
          <Divider />
          {/* GEÇİCİ: connectionStore.ts henüz bağlanmadı, sabit değer gösteriyor. */}
          <Stack direction="row" justify="space-between" align="center" style={{ padding: spacing.md }}>
            <Text variant="body" color="textSecondary">
              Bağlantı
            </Text>
            <Stack direction="row" align="center" gap="xs">
              <Ionicons name="checkmark-circle" size={16} color={colors.blue} />
              <Text variant="bodyBold" color="blue">
                Çevrimiçi
              </Text>
            </Stack>
          </Stack>
        </Box>

        <Box style={{ flex: 1 }} />

        <Button label="Oturumu Kapat" onPress={() => setConfirmVisible(true)} variant="dangerOutline" />

        <Text variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.md }}>
          MTS {appVersion}
        </Text>
      </Box>

      <ConfirmSheet
        visible={confirmVisible}
        title="Oturumu kapatmak istediğinize emin misiniz?"
        description="Cihaz kart okutma ekranına döner."
        confirmLabel="Evet, Çıkış Yap"
        variant="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="space-between" style={{ padding: spacing.md }}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </Stack>
  );
}

function Divider() {
  return <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />;
}