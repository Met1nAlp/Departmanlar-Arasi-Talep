// src/screens/auth/DeviceEnrollScreen.tsx
//
// Plan Bölüm 14.2, adım 1: "Cihaz kaydı (bir kez, kurulumda)". Bu ekran
// AuthNavigator'da EN ÖNCE gösterilir — cihaz henüz kayıtlı değilse yetkili
// girişi bile açılmaz (BT/kurulum yapan kişi bir kez kayıt kodunu girer,
// sonrasında cihaz kalıcı olarak kayıtlı kalır, bkz. store/deviceStore.ts).
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDeviceStore } from '../../store/deviceStore';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { AuthError } from '../../api/auth';
import { useTranslation } from '../../i18n';

type EnrollFormValues = z.infer<ReturnType<typeof buildEnrollSchema>>;

function buildEnrollSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z.object({
    enrollCode: z.string().min(1, t('auth.deviceEnroll.codeRequired')),
  });
}

export default function DeviceEnrollScreen() {
  const enroll = useDeviceStore((s) => s.enroll);
  const { t } = useTranslation();
  const enrollSchema = buildEnrollSchema(t);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EnrollFormValues>({
    resolver: zodResolver(enrollSchema),
    defaultValues: { enrollCode: '' },
  });

  const onSubmit = async (values: EnrollFormValues) => {
    try {
      await enroll(values.enrollCode);
    } catch (err) {
      const message = err instanceof AuthError ? err.message : t('auth.deviceEnroll.errorGeneric');
      setError('enrollCode', { message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        {t('auth.deviceEnroll.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('auth.deviceEnroll.subtitle')}
      </Text>

      <Controller
        control={control}
        name="enrollCode"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            testID="device-enroll-code-input"
            style={styles.input}
            placeholder={t('auth.deviceEnroll.codePlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.enrollCode && <Text style={styles.errorText}>{errors.enrollCode.message}</Text>}

      <TouchableOpacity
        testID="device-enroll-submit"
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>{t('auth.deviceEnroll.submit')}</Text>
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
