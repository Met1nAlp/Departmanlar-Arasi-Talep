// src/screens/auth/LoginScreen.tsx
//
// Plan Bölüm 14.2, adım 2: "Yetkili girişi (vardiya başı)". Eski rol-seçim
// butonları kalktı — artık gerçek kullanıcı adı/şifre formu var. Başarılı
// girişten sonra RootNavigator, activeSession henüz olmadığını görüp
// PinSessionScreen'e yönlendirir (personel kendini seçip PIN girer).
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { AuthError } from '../../api/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Şifre gerekli'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const loginSupervisor = useAuthStore((s) => s.loginSupervisor);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginSupervisor(values.username, values.password);
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Giriş yapılamadı. Tekrar deneyin.';
      setError('password', { message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        Talep Uygulaması
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        Yetkili girişi
      </Text>

      <Controller
        control={control}
        name="username"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı adı"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>Giriş Yap</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, fontSize: 16, color: colors.textPrimary,
  },
  errorText: { color: '#B00020', marginBottom: spacing.sm, fontSize: 13 },
  button: {
    backgroundColor: colors.blue, borderRadius: radius.md, padding: spacing.md,
    marginTop: spacing.sm, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
});
