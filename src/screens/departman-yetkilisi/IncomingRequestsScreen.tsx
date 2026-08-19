// src/screens/departman-yetkilisi/IncomingRequestsScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

// Hazırlama kuyruğu: sadece aktif (hazırlanmayı bekleyen) talepler
const QUEUE_STATUSES = ['TALEP_ALINDI', 'HAZIRLANIYOR', 'HAZIR', 'KISMI_HAZIR'];

type Filter = 'KUYRUK' | 'TUMU';

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useActiveUser();
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('KUYRUK');

  const loadRequests = useCallback(async () => {
    if (!user?.departmentId) return;
    setLoading(true);
    const reqs = await getRequests({ departmentId: user.departmentId });
    setAllRequests(reqs);
    const productList = await getProductsByIds(reqs.map((r) => r.productId));
    setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Gerçek zamanlı güncelleme — herhangi bir talep değişince yeniden çek
  useRequestUpdates(() => { void loadRequests(); });

  const displayed = filter === 'KUYRUK'
    ? allRequests
        .filter((r) => QUEUE_STATUSES.includes(r.status))
        // Öncelik sıralaması: LINE_DOWN > URGENT > NORMAL > PLANNED
        .sort((a, b) => {
          const order = { LINE_DOWN: 0, URGENT: 1, NORMAL: 2, PLANNED: 3 };
          return (order[a.priority ?? 'NORMAL'] ?? 2) - (order[b.priority ?? 'NORMAL'] ?? 2);
        })
    : allRequests;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Filtre sekmeleri */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, filter === 'KUYRUK' && styles.tabActive]}
          onPress={() => setFilter('KUYRUK')}
        >
          <Text style={[styles.tabText, filter === 'KUYRUK' && styles.tabTextActive]}>
            📦 Kuyruk ({allRequests.filter((r) => QUEUE_STATUSES.includes(r.status)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'TUMU' && styles.tabActive]}
          onPress={() => setFilter('TUMU')}
        >
          <Text style={[styles.tabText, filter === 'TUMU' && styles.tabTextActive]}>
            📋 Tümü ({allRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            {filter === 'KUYRUK' ? 'Hazırlanacak talep yok 🎉' : 'Gelen talep yok'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.blue },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.blue },
});