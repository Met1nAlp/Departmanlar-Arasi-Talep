// src/screens/saha-personeli/RequestTrackingScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { statusLabels, statusOrder, priorityLabels, priorityColors } from '../../utils/statusLabels';
import { getRequestById } from '../../api/requests';
import { sendCancelRequest } from '../../infrastructure/realtime/MepsanService';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Rt = RouteProp<SahaPersoneliStackParamList, 'RequestTracking'>;
type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestTracking'>;

/** Talebin iptal edilebilir olduğu statüler */
const CANCELLABLE_STATUSES = ['TALEP_ALINDI', 'HAZIRLANIYOR'];

export default function RequestTrackingScreen() {
  const route = useRoute<Rt>();
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getRequestById(route.params.requestId).then((req) => {
      if (req) setRequest(req);
    });
  }, [route.params.requestId]);

  // Departman durumu değiştirdiğinde bu ekran otomatik güncellenir
  useRequestUpdates(setRequest, route.params.requestId);

  const handleCancel = () => {
    Alert.alert(
      'Talebi İptal Et',
      'Bu talebi iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            if (!request) return;
            setCancelling(true);
            try {
              await sendCancelRequest(request.id, 'Kullanıcı tarafından iptal edildi');
              // Yerel state'i hemen güncelle
              setRequest((prev) => prev ? { ...prev, status: 'IPTAL_EDILDI' } : prev);
            } catch (e) {
              Alert.alert('Hata', 'Talep iptal edilemedi. Lütfen tekrar deneyin.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (!request) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const isTerminal = request.status === 'TESLIM_EDILDI' || request.status === 'IPTAL_EDILDI';
  const isCancellable = CANCELLABLE_STATUSES.includes(request.status);
  const currentIndex = statusOrder.indexOf(request.status);
  const priority = request.priority ?? 'NORMAL';

  return (
    <View style={styles.container}>
      {/* Öncelik Rozeti */}
      {priority !== 'NORMAL' && (
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>
            {priorityLabels[priority]}
          </Text>
        </View>
      )}

      {/* İptal edilmişse ayrı göster */}
      {request.status === 'IPTAL_EDILDI' ? (
        <View style={styles.cancelledBox}>
          <Text style={[typography.h2, { color: colors.red, textAlign: 'center' }]}>❌ Talep İptal Edildi</Text>
          {request.cancelReason ? (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
              Neden: {request.cancelReason}
            </Text>
          ) : null}
        </View>
      ) : (
        /* Normal durum adımları */
        statusOrder.map((status, index) => {
          const isDone = index <= currentIndex;
          return (
            <View key={status} style={styles.stepRow}>
              <View style={[styles.dot, { backgroundColor: isDone ? colors.blue : colors.border }]} />
              <Text style={[typography.body, { color: isDone ? colors.textPrimary : colors.textMuted, marginLeft: spacing.sm }]}>
                {statusLabels[status]}
              </Text>
            </View>
          );
        })
      )}

      {/* Teslim Alma Butonu */}
      {request.status === 'YOLDA' && user && canConfirmDelivery(user.role) && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => navigation.navigate('DeliveryConfirm', { requestId: request.id })}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>Ürünü Teslim Aldım</Text>
        </TouchableOpacity>
      )}

      {/* İptal Butonu — sadece iptal edilebilir durumlarda */}
      {isCancellable && !isTerminal && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? <ActivityIndicator color={colors.white} /> : (
            <Text style={{ color: colors.white, fontWeight: '600' }}>Talebi İptal Et</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dot: { width: 16, height: 16, borderRadius: 8 },
  priorityBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.lg, marginBottom: spacing.md,
  },
  confirmButton: {
    marginTop: spacing.lg, backgroundColor: colors.blue, padding: spacing.md,
    borderRadius: radius.md, alignItems: 'center',
  },
  cancelButton: {
    marginTop: spacing.md, backgroundColor: colors.red, padding: spacing.md,
    borderRadius: radius.md, alignItems: 'center',
  },
  cancelledBox: {
    backgroundColor: colors.redLight, padding: spacing.lg, borderRadius: radius.md,
    marginVertical: spacing.lg,
  },
});