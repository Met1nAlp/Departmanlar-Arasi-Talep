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

const enrollSchema = z.object({
  enrollCode: z.string().min(1, 'Kayıt kodu gerekli'),
});

type EnrollFormValues = z.infer<typeof enrollSchema>;

export default function DeviceEnrollScreen() {
  const enroll = useDeviceStore((s) => s.enroll);
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
      const message = err instanceof AuthError ? err.message : 'Cihaz kaydı başarısız. Tekrar deneyin.';
      setError('enrollCode', { message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h1, { color: colors.blue, marginBottom: spacing.xl }]}>
        Cihaz Kaydı
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        Bu cihaz henüz kayıtlı değil. Sistem yöneticinizden aldığınız kayıt kodunu girin.
      </Text>

      <Controller
        control={control}
        name="enrollCode"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={styles.input}
            placeholder="Kayıt kodu"
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
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>Cihazı Kaydet</Text>
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
