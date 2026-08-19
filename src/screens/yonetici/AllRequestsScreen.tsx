// src/screens/yonetici/AllRequestsScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Request, RequestStatus } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { statusLabels, priorityLabels, priorityColors } from '../../utils/statusLabels';

const STATUS_FILTERS: Array<{ key: RequestStatus | 'TUMU'; label: string }> = [
  { key: 'TUMU', label: 'Tümü' },
  { key: 'TALEP_ALINDI', label: 'Alındı' },
  { key: 'HAZIRLANIYOR', label: 'Hazırlanıyor' },
  { key: 'HAZIR', label: 'Hazır' },
  { key: 'YOLDA', label: 'Yolda' },
  { key: 'TESLIM_EDILDI', label: 'Teslim' },
  { key: 'IPTAL_EDILDI', label: 'İptal' },
  { key: 'ESKALASYON', label: '⚠️ Eskale' },
];

export default function AllRequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'TUMU'>('TUMU');

  const load = useCallback(async () => {
    setLoading(true);
    const reqs = await getRequests({});
    setRequests(reqs);
    const productList = await getProductsByIds(reqs.map((r) => r.productId));
    setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = statusFilter === 'TUMU'
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Özet sayaclar */}
      <View style={styles.summaryRow}>
        <SummaryChip label="Toplam" count={requests.length} color={colors.blue} />
        <SummaryChip label="Aktif" count={requests.filter((r) => !['TESLIM_EDILDI','IPTAL_EDILDI'].includes(r.status)).length} color={colors.blueMedium} />
        <SummaryChip label="Eskale" count={requests.filter((r) => r.status === 'ESKALASYON').length} color={colors.red} />
        <SummaryChip label="Teslim" count={requests.filter((r) => r.status === 'TESLIM_EDILDI').length} color={colors.green} />
      </View>

      {/* Durum filtresi */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(item.key as RequestStatus | 'TUMU')}
          >
            <Text style={[styles.filterText, statusFilter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Liste */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard request={item} productName={products[item.productId]} />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Bu filtrede kayıtlı talep yok
          </Text>
        }
      />
    </View>
  );
}

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.summaryChip, { borderColor: color }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row', padding: spacing.md, gap: 8, borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryChip: {
    flex: 1, borderWidth: 1.5, borderRadius: radius.sm, padding: 6, alignItems: 'center',
  },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: colors.textMuted },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.white,
  },
  filterChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.white },
});