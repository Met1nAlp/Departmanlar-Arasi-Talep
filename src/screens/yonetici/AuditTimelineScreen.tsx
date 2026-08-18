import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { YoneticiStackParamList } from '../../navigation/types';
import { Request, RequestStatus } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing } from '../../design-system/tokens';
import { statusLabels } from '../../utils/statusLabels';
import { getRequestById } from '../../api/requests';
import { getProductsByIds } from '../../api/products';

type Rt = RouteProp<YoneticiStackParamList, 'AuditTimeline'>;

// Her durumun hangi zaman damgası alanına karşılık geldiğini eşliyoruz.
// Bu eşleme sabit çünkü Request tipimizdeki alan isimleri (preparedAt, readyAt vb.)
// zaten M1'den önce, mimari kurulurken planlanmıştı.
const statusTimestampMap: { status: RequestStatus; field: keyof Request }[] = [
  { status: 'TALEP_ALINDI', field: 'createdAt' },
  { status: 'HAZIRLANIYOR', field: 'preparedAt' },
  { status: 'HAZIR', field: 'readyAt' },
  { status: 'YOLDA', field: 'onTheWayAt' },
  { status: 'TESLIM_EDILDI', field: 'deliveredAt' },
];

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditTimelineScreen() {
  const route = useRoute<Rt>();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      setRequest(req);
      const [product] = await getProductsByIds([req.productId]);
      setProductName(product?.name ?? '');
    });
  }, [route.params.requestId]);

  if (!request) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <Text variant="h2">{productName}</Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
        Talep No: {request.id}
      </Text>

      {statusTimestampMap.map(({ status, field }, index) => {
        // Bu alanın değeri (örn. request.preparedAt) dolu mu, boş mu kontrol ediyoruz.
        // Dolu ise o adım gerçekleşmiş demektir.
        const timestamp = request[field] as string | undefined;
        const hasHappened = !!timestamp;
        const isLast = index === statusTimestampMap.length - 1;

        return (
          <View key={status} style={styles.row}>
            <View style={styles.timelineColumn}>
              <View style={[styles.dot, { backgroundColor: hasHappened ? colors.blue : colors.border }]} />
              {!isLast && (
                <View style={[styles.line, { backgroundColor: hasHappened ? colors.blue : colors.border }]} />
              )}
            </View>
            <View style={styles.contentColumn}>
              <Text variant="bodyBold" color={hasHappened ? 'textPrimary' : 'textMuted'}>
                {statusLabels[status]}
              </Text>
              <Text variant="caption" color="textMuted">
                {hasHappened ? formatDateTime(timestamp!) : 'Henüz gerçekleşmedi'}
              </Text>
            </View>
          </View>
        );
      })}
    </Box>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 32,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: spacing.lg,
    marginLeft: spacing.sm,
  },
});