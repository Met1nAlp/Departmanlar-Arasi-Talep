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

// Rol isimlerini Türkçe okunabilir hale getiriyoruz — kullanıcıya
// "saha_personeli" gibi teknik bir string göstermek yerine.
const roleLabels: Record<string, string> = {
  saha_personeli: 'Saha Personeli',
  departman_yetkilisi: 'Departman Yetkilisi',
  yonetici: 'Yönetici',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // İki katmanlı oturum (Plan Bölüm 14.2): ekranda görünen kişi PIN ile oturum
  // açmış personeldir; arkasındaki yetkili (supervisor) vardiya boyunca bağlı kalır.
  const user = useActiveUser();
  const supervisor = useAuthStore((s) => s.supervisor);
  const endStaffSession = useAuthStore((s) => s.endStaffSession);
  const logoutSupervisor = useAuthStore((s) => s.logoutSupervisor);
  const deviceUid = useDeviceStore((s) => s.deviceUid);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [shiftEndVisible, setShiftEndVisible] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  // expo-constants, cihaz/uygulama bilgilerini (sürüm no, cihaz adı vb.)
  // native koda hiç dokunmadan okumamızı sağlıyor. PDF'in "ayarlar/cihaz bilgisi"
  // maddesi tam olarak bunu istiyor.
  const appVersion = Constants.expoConfig?.version ?? 'bilinmiyor';

  useEffect(() => {
    if (!user?.departmentId) return;
    getDepartments().then((departments) => {
      setDepartmentName(departments.find((d) => d.id === user.departmentId)?.name ?? '');
    });
  }, [user]);

  // Personel çıkışı: yalnızca PIN oturumu kapanır, yetkili bağlı kalır — cihaz
  // bir sonraki personele PIN ekranında devredilir (vardiya içi devir).
  const handleLogoutConfirm = async () => {
    setConfirmVisible(false);
    await endStaffSession('MANUAL');
    // Not: activeSession null olunca RootNavigator otomatik olarak AuthNavigator'a
    // döner, o da supervisor hâlâ bağlı olduğu için PinSession ekranını gösterir.
    // Elle navigation.navigate çağrısına gerek YOK.
  };

  // Vardiya sonu: yetkili oturumu da kapanır, SecureStore'daki token'lar silinir
  // ve cihaz baştan kullanıcı adı/şifre girişi ister.
  const handleShiftEndConfirm = async () => {
    setShiftEndVisible(false);
    await endStaffSession('SHIFT_END');
    await logoutSupervisor();
  };

  const initials = user
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

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
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          background="blueMedium"
          radius="md"
          accessibilityLabel="Geri"
          style={{ marginBottom: spacing.md }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Stack direction="row" align="center" gap="md">
          <Box
            background="blueMedium"
            style={{ width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text variant="h2" color="white">
              {initials}
            </Text>
          </Box>
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

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md">
          <InfoRow label="Departman" value={departmentName || '—'} />
          <Divider />
          <InfoRow label="Vardiya Amiri" value={supervisor?.name ?? '—'} />
          <Divider />
          <InfoRow label="Cihaz" value={deviceUid ?? 'kayıtlı değil'} />
          <Divider />
          <InfoRow label="Uygulama Sürümü" value={appVersion} />
          <Divider />
          <InfoRow label="Cihaz Adı" value={Constants.deviceName ?? 'bilinmiyor'} />
        </Box>

        <Box style={{ flex: 1 }} />

        <Button label="Oturumu Kapat" onPress={() => setConfirmVisible(true)} variant="dangerOutline" />

        <Button
          label="Vardiyayı Bitir"
          onPress={() => setShiftEndVisible(true)}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />
      </Box>

      <ConfirmSheet
        visible={confirmVisible}
        title="Oturumu kapatmak istediğinize emin misiniz?"
        description="Cihaz PIN ekranına döner. Vardiya amiri oturumu açık kalır."
        confirmLabel="Evet, Çıkış Yap"
        variant="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmSheet
        visible={shiftEndVisible}
        title="Vardiyayı bitirmek istediğinize emin misiniz?"
        description="Yetkili oturumu da kapanır; cihaz yeniden kullanıcı adı ve şifre ister."
        confirmLabel="Evet, Vardiyayı Bitir"
        variant="danger"
        onConfirm={handleShiftEndConfirm}
        onCancel={() => setShiftEndVisible(false)}
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
