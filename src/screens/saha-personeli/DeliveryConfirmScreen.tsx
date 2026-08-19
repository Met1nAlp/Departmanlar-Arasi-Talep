// src/screens/saha-personeli/DeliveryConfirmScreen.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { sendUpdateRequestStatus } from '../../infrastructure/realtime/MepsanService';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';
import { emitRequestStatusChanged } from '../../api/socketEvents';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [confirming, setConfirming] = useState(false);

  const allowed = user ? canConfirmDelivery(user.role) : false;

  const handleConfirm = async () => {
    if (!allowed) return;
    setConfirming(true);
    try {
      // Gerçek backend komutu — TESLIM_EDILDI statüsüne geç, timestamp da gönder
      await sendUpdateRequestStatus(
        route.params.requestId,
        'TESLIM_EDILDI',
        'delivered_at',
        new Date().toISOString()
      );
      // Uygulama içi broadcast (yerel ekranları da günceller)
      emitRequestStatusChanged({
        id: route.params.requestId,
        status: 'TESLIM_EDILDI',
      } as any);
      navigation.popToTop();
    } catch (e) {
      Alert.alert('Hata', 'Teslim onayı gönderilemedi. Lütfen bağlantınızı kontrol edin.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Onay ikonu */}
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>📦</Text>
      </View>

      <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
        Teslim Onayı
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }]}>
        Ürünü teslim aldığınızı onaylıyor musunuz?{'\n'}
        Onayladığınızda ilgili departmana bildirim gönderilecek.
      </Text>

      {!allowed && (
        <Text style={[typography.caption, { color: colors.red, textAlign: 'center', marginTop: spacing.md }]}>
          Bu işlem için yetkiniz bulunmuyor.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.confirmButton, !allowed && { backgroundColor: colors.border }]}
        onPress={handleConfirm}
        disabled={confirming || !allowed}
      >
        {confirming ? <ActivityIndicator color={colors.white} /> : (
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>✅ Evet, Teslim Aldım</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={confirming}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Geri Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  iconWrapper: { alignItems: 'center', marginBottom: spacing.lg },
  icon: { fontSize: 64 },
  confirmButton: {
    marginTop: spacing.xl, backgroundColor: colors.blue, padding: spacing.md + 4,
    borderRadius: radius.md, alignItems: 'center',
  },
  backButton: {
    marginTop: spacing.md, padding: spacing.md, alignItems: 'center',
  },
});