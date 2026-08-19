// src/screens/yonetici/SettingsScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { useAuthStore, useActiveUser } from '../../store/authStore';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const supervisor = useAuthStore((s) => s.supervisor);
  const activeUser = useActiveUser();
  const logout = useAuthStore((s) => s.logoutSupervisor);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Sistemden çıkmak istediğinize emin misiniz? Bir sonraki girişte şifrenizi tekrar girmeniz gerekecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profil Kartı */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {supervisor?.name ?? 'Bilinmeyen'}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Rol: {supervisor?.role ?? '-'}
          </Text>
          {activeUser && (
            <Text style={[typography.caption, { color: colors.blue }]}>
              Aktif Personel: {activeUser.name}
            </Text>
          )}
        </View>
      </View>

      {/* Ayarlar Grupları */}
      <SettingsGroup title="Hesap">
        <SettingsItem icon="🔐" label="Bağlı Cihaz ID" value={supervisor?.id ?? '-'} />
        <SettingsItem icon="🏢" label="Departman ID" value={supervisor?.departmentId ?? 'Tüm Departmanlar'} />
      </SettingsGroup>

      <SettingsGroup title="Uygulama">
        <SettingsItem icon="📱" label="Uygulama Versiyonu" value={APP_VERSION} />
        <SettingsItem icon="🌐" label="Protokol" value="WebSocket (ws://)" />
      </SettingsGroup>

      {/* Çıkış Butonu */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>🚪 Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={settingsStyles.group}>
      <Text style={settingsStyles.groupTitle}>{title}</Text>
      <View style={settingsStyles.groupBody}>{children}</View>
    </View>
  );
}

function SettingsItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={settingsStyles.item}>
      <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{icon}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{label}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, maxWidth: 160, textAlign: 'right' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutButton: {
    margin: spacing.lg, backgroundColor: colors.red, padding: spacing.md + 4,
    borderRadius: radius.md, alignItems: 'center',
  },
});

const settingsStyles = StyleSheet.create({
  group: { marginTop: spacing.lg },
  groupTitle: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.xs,
    fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  groupBody: {
    backgroundColor: colors.white, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
});
