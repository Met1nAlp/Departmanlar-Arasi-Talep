import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { UserRole } from '../../types';

const mockUsers: { role: UserRole; name: string; departmentId?: string }[] = [
  { role: 'saha_personeli', name: 'Ahmet (Saha Personeli)' },
  { role: 'departman_yetkilisi', name: 'Elif (Depo Departmanı)', departmentId: 'dep-1' },
  { role: 'yonetici', name: 'Mehmet (Yönetici)' },
];

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        Talep Uygulaması
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        Test için bir rol seçin
      </Text>
      {mockUsers.map((u) => (
        <TouchableOpacity
          key={u.role}
          style={styles.button}
          onPress={() =>
            login({ id: `user-${u.role}`, name: u.name, role: u.role, departmentId: u.departmentId })
          }
        >
          <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>{u.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
});