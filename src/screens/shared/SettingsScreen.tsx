import { View } from 'react-native';
import Constants from 'expo-constants';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { ConfirmSheet } from '../../design-system/components/ConfirmSheet';
import { spacing, colors } from '../../design-system/tokens';
import { useAuthStore, useActiveUser } from '../../store/authStore';
import { useState } from 'react';

// Rol isimlerini Türkçe okunabilir hale getiriyoruz — kullanıcıya
// "saha_personeli" gibi teknik bir string göstermek yerine.
const roleLabels: Record<string, string> = {
  saha_personeli: 'Saha Personeli',
  departman_yetkilisi: 'Departman Yetkilisi',
  yonetici: 'Yönetici',
};

export default function SettingsScreen() {
  // İki katmanlı oturum (Plan Bölüm 14.2): ekranda görünen kişi PIN ile oturum
  // açmış personeldir; arkasındaki yetkili (supervisor) vardiya boyunca bağlı kalır.
  const user = useActiveUser();
  const supervisor = useAuthStore((s) => s.supervisor);
  const endStaffSession = useAuthStore((s) => s.endStaffSession);
  const logoutSupervisor = useAuthStore((s) => s.logoutSupervisor);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [shiftEndVisible, setShiftEndVisible] = useState(false);

  // expo-constants, cihaz/uygulama bilgilerini (sürüm no, cihaz adı vb.)
  // native koda hiç dokunmadan okumamızı sağlıyor. PDF'in "ayarlar/cihaz bilgisi"
  // maddesi tam olarak bunu istiyor.
  const appVersion = Constants.expoConfig?.version ?? 'bilinmiyor';

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

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <Text variant="h2" style={{ marginBottom: spacing.lg }}>
        Ayarlar
      </Text>

      <Stack gap="md">
        <InfoRow label="Kullanıcı" value={user?.name ?? '—'} />
        <InfoRow label="Rol" value={user ? roleLabels[user.role] : '—'} />
        <InfoRow label="Vardiya Amiri" value={supervisor?.name ?? '—'} />
        <InfoRow label="Uygulama Sürümü" value={appVersion} />
        <InfoRow label="Cihaz" value={Constants.deviceName ?? 'bilinmiyor'} />
      </Stack>

      <View style={{ flex: 1 }} />

      <Button
        label="Oturumu Kapat"
        onPress={() => setConfirmVisible(true)}
        variant="danger"
      />

      <Button
        label="Vardiyayı Bitir"
        onPress={() => setShiftEndVisible(true)}
        variant="secondary"
        style={{ marginTop: spacing.sm }}
      />

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

// Küçük bir yardımcı bileşen — "Etiket: Değer" satırlarını tekrar tekrar
// yazmamak için. Sadece bu dosyada kullanılacağı için ayrı dosyaya çıkarmadık.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="space-between">
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyBold">{value}</Text>
    </Stack>
  );
}