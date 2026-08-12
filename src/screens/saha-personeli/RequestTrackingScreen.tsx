// src/screens/saha-personeli/RequestTrackingScreen.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { RequestStatus } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { statusLabels, statusOrder } from '../../utils/statusLabels';

type Rt = RouteProp<SahaPersoneliStackParamList, 'RequestTracking'>;
type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestTracking'>;

// GEÇİCİ: gerçek durumu route.params.requestId ile backend'den çekeceğiz (Faz 2)
const mockCurrentStatus: RequestStatus = 'YOLDA';

export default function RequestTrackingScreen() {
  const navigation = useNavigation<Nav>();
  const currentIndex = statusOrder.indexOf(mockCurrentStatus);

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

      {mockCurrentStatus === 'YOLDA' && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => navigation.navigate('DeliveryConfirm', { requestId: 'r1' })}
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
  confirmButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.blue,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});