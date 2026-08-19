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
import { useTranslation } from '../../i18n';

type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;

function buildLoginSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z.object({
    username: z.string().min(1, t('auth.login.usernameRequired')),
    password: z.string().min(1, t('auth.login.passwordRequired')),
  });
}

export default function LoginScreen() {
  const loginSupervisor = useAuthStore((s) => s.loginSupervisor);
  const { t } = useTranslation();
  const loginSchema = buildLoginSchema(t);
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
      const message = err instanceof AuthError ? err.message : t('auth.login.errorGeneric');
      setError('password', { message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        {t('auth.login.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('auth.login.subtitle')}
      </Text>

      <Controller
        control={control}
        name="username"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            testID="login-username-input"
            style={styles.input}
            placeholder={t('auth.login.usernamePlaceholder')}
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
            testID="login-password-input"
            style={styles.input}
            placeholder={t('auth.login.passwordPlaceholder')}
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
        testID="login-submit"
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>{t('auth.login.submit')}</Text>
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
