// src/screens/departman-yetkilisi/RequestDetailScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request, RequestStatus } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import StatusBadge from '../../components/StatusBadge';
import { getRequestById, updateRequestStatus } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;

const nextStatusMap: Partial<Record<RequestStatus, RequestStatus>> = {
  TALEP_ALINDI: 'HAZIRLANIYOR',
  HAZIRLANIYOR: 'HAZIR',
  HAZIR: 'YOLDA',
};

const nextActionLabel: Partial<Record<RequestStatus, string>> = {
  TALEP_ALINDI: 'Hazırlamaya Başla',
  HAZIRLANIYOR: '"Hazır" Olarak İşaretle',
  HAZIR: 'Elektrikli Transpalet ile Yola Çık',
};

export default function RequestDetailScreen() {
  const route = useRoute<Rt>();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      setRequest(req);
      const [product] = await getProductsByIds([req.productId]);
      setProductName(product?.name ?? '');
    });
  }, [route.params.requestId]);

  const handleAdvance = async () => {
    if (!request) return;
    const next = nextStatusMap[request.status];
    if (!next) return;
    setUpdating(true);
    const updated = await updateRequestStatus(request.id, next);
    setRequest(updated);
    setUpdating(false);
  };

  if (!request) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const next = nextStatusMap[request.status];

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.textPrimary }]}>{productName}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Adet: {request.quantity}
      </Text>
      <View style={{ marginTop: spacing.md }}>
        <StatusBadge status={request.status} />
      </View>

      {next ? (
        <TouchableOpacity style={styles.actionButton} onPress={handleAdvance} disabled={updating}>
          {updating ? <ActivityIndicator color={colors.white} /> : (
            <Text style={{ color: colors.white, fontWeight: '600' }}>{nextActionLabel[request.status]}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.lg }]}>
          Bu talep için departman tarafında yapılacak başka işlem yok.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.lg },
  actionButton: { marginTop: spacing.xl, backgroundColor: colors.blue, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});