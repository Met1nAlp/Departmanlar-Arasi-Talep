// src/screens/saha-personeli/RequestTrackingScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { statusLabels, statusOrder } from '../../utils/statusLabels';
import { getRequestById } from '../../api/requests';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { useAuthStore } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Rt = RouteProp<SahaPersoneliStackParamList, 'RequestTracking'>;
type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestTracking'>;

export default function RequestTrackingScreen() {
  const route = useRoute<Rt>();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [request, setRequest] = useState<Request | null>(null);

  useEffect(() => {
    getRequestById(route.params.requestId).then((req) => {
      if (req) setRequest(req);
    });
  }, [route.params.requestId]);

  // YENİ: departman durumu değiştirdiği anda bu ekran otomatik güncellenir
  useRequestUpdates(setRequest, route.params.requestId);

  if (!request) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const currentIndex = statusOrder.indexOf(request.status);

  return (
    <View style={styles.container}>
      {statusOrder.map((status, index) => {
        const isDone = index <= currentIndex;
        return (
          <View key={status} style={styles.stepRow}>
            <View style={[styles.dot, { backgroundColor: isDone ? colors.blue : colors.border }]} />
            <Text style={[typography.body, { color: isDone ? colors.textPrimary : colors.textMuted, marginLeft: spacing.sm }]}>
              {statusLabels[status]}
            </Text>
          </View>
        );
      })}

      {request.status === 'YOLDA' && user && canConfirmDelivery(user.role) && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => navigation.navigate('DeliveryConfirm', { requestId: request.id })}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>Ürünü Teslim Aldım</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dot: { width: 16, height: 16, borderRadius: 8 },
  confirmButton: { marginTop: spacing.lg, backgroundColor: colors.blue, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});