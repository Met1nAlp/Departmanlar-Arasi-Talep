// src/screens/auth/LoginScreen.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { UserRole } from '../../types';
import { login } from '../../api/auth';

// Rol seçim butonları için sadece etiketler — gerçek kullanıcı verisi artık api/auth.ts'den geliyor
const roleOptions: { role: UserRole; label: string }[] = [
  { role: 'saha_personeli', label: 'Saha Personeli' },
  { role: 'departman_yetkilisi', label: 'Departman Yetkilisi' },
  { role: 'yonetici', label: 'Yönetici' },
];

export default function LoginScreen() {
  const storeLogin = useAuthStore((s) => s.login);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleLogin = async (role: UserRole) => {
    setLoadingRole(role);
    const user = await login(role);
    storeLogin(user);
    setLoadingRole(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        Talep Uygulaması
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        Test için bir rol seçin
      </Text>
      {roleOptions.map((opt) => (
        <TouchableOpacity
          key={opt.role}
          style={styles.button}
          onPress={() => handleLogin(opt.role)}
          disabled={loadingRole !== null}
        >
          {loadingRole === opt.role ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>{opt.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  button: {
    backgroundColor: colors.blue, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, alignItems: 'center',
  },
});