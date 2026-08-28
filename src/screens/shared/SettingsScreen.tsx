// src/screens/shared/SettingsScreen.tsx
import { useState } from 'react';
import { View } from 'react-native';
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
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { useAuthStore, useActiveUser } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useDeviceStore } from '../../store/deviceStore';

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
  const isConnected = useConnectionStore((s) => s.status === 'CONNECTED');
  const deviceUid = useDeviceStore((s) => s.deviceUid);
  const appVersion = Constants.expoConfig?.version ?? '—';
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleLogout = () => {
    setConfirmVisible(true);
  };

  const performLogout = () => {
    setConfirmVisible(false);
    logout();
  };

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
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box style={{ flex: 1 }}>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              AYARLAR
            </Text>
            <Text variant="h2" color="white" numberOfLines={1}>
              {user?.name ?? '—'}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md">
          <SettingsRow label="Rol" value={user ? roleLabels[user.role] ?? user.role : '—'} />
          {user?.departmentId && (
            <>
              <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
              <SettingsRow label="Departman" value={user.departmentId} />
            </>
          )}
          <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
          <SettingsRow label="Cihaz" value={deviceUid ?? '—'} mono />
          <Box style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
          <Stack direction="row" justify="space-between" align="center" style={{ padding: spacing.md }}>
            <Text variant="body" color="textSecondary">
              Bağlantı
            </Text>
            <Stack direction="row" align="center" gap="xs">
              <Box
                style={{
                  width: scale(8),
                  height: scale(8),
                  borderRadius: 999,
                  backgroundColor: isConnected ? colors.success : colors.danger,
                }}
              />
              <Text variant="bodyBold" color={isConnected ? 'success' : 'danger'}>
                {isConnected ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>
            </Stack>
          </Stack>
        </Box>

        <View style={{ flex: 1 }} />

        <Button label="Oturumu Kapat" onPress={handleLogout} variant="danger" />

        <Text variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.md }}>
          Mepsan MTS · v{appVersion}
        </Text>
      </Box>

      <ConfirmSheet
        visible={confirmVisible}
        title="Oturumu kapatmak istediğinize emin misiniz?"
        description="Tekrar giriş yapmak için kartınızı okutmanız gerekecek."
        confirmLabel="Evet, Çıkış Yap"
        variant="danger"
        onConfirm={performLogout}
        onCancel={() => setConfirmVisible(false)}
      />
    </Box>
  );
}

function SettingsRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Stack direction="row" justify="space-between" align="center" style={{ padding: spacing.md }}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant={mono ? 'mono' : 'bodyBold'} numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </Stack>
  );
}