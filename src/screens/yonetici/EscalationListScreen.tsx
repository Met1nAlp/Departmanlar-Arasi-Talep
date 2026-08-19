// src/screens/yonetici/EscalationListScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { sendGetEscalated, sendUpdatePriority } from '../../infrastructure/realtime/MepsanService';
import { priorityLabels, priorityColors } from '../../utils/statusLabels';
import { Priority } from '../../types';

type EscalatedRequest = {
  id: string;
  requesterId: string;
  departmentId: string;
  productId: string;
  quantity: number;
  status: string;
  priority: Priority;
  fulfilledQuantity: number;
  createdAt: string;
};

const PRIORITIES: Priority[] = ['NORMAL', 'URGENT', 'LINE_DOWN'];

export default function EscalationListScreen() {
  const [requests, setRequests] = useState<EscalatedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // id

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sendGetEscalated();
      if (res.status === 'ok') {
        setRequests((res.data as EscalatedRequest[]) ?? []);
      }
    } catch {
      // Bağlantı yoksa boş göster
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChangePriority = (reqId: string, currentPriority: Priority) => {
    Alert.alert(
      'Öncelik Değiştir',
      'Yeni öncelik seçin:',
      PRIORITIES.filter((p) => p !== currentPriority).map((p) => ({
        text: priorityLabels[p],
        onPress: async () => {
          setUpdating(reqId);
          try {
            await sendUpdatePriority(reqId, p);
            setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, priority: p } : r));
          } catch {
            Alert.alert('Hata', 'Öncelik güncellenemedi.');
          } finally {
            setUpdating(null);
          }
        },
      }))
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Başlık Bilgi */}
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.red }]}>⚠️ Eskalasyon Listesi</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          SLA süresini aşan veya manuel olarak eskalasyona alınan talepler
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Üst satır */}
            <View style={styles.cardHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority ?? 'NORMAL'] }]}>
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>
                  {priorityLabels[item.priority ?? 'NORMAL']}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                #{item.id.slice(-6).toUpperCase()}
              </Text>
            </View>

            {/* İçerik */}
            <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              Ürün: {item.productId} — {item.quantity} adet
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Talep eden: {item.requesterId}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Oluşturulma: {new Date(item.createdAt).toLocaleString('tr-TR')}
            </Text>

            {/* Öncelik değiştirme butonu */}
            <TouchableOpacity
              style={styles.changePriorityBtn}
              onPress={() => handleChangePriority(item.id, item.priority ?? 'NORMAL')}
              disabled={updating === item.id}
            >
              {updating === item.id
                ? <ActivityIndicator size="small" color={colors.blue} />
                : <Text style={{ color: colors.blue, fontWeight: '600', fontSize: 13 }}>🔄 Önceliği Değiştir</Text>
              }
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Eskalasyon Yok
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              Tüm talepler zamanında işleniyor
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md, backgroundColor: colors.redLight,
    borderBottomWidth: 1, borderBottomColor: colors.red,
  },
  card: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.red,
    shadowColor: colors.red, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.lg,
  },
  changePriorityBtn: {
    marginTop: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center',
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.blue,
  },
  emptyBox: { alignItems: 'center', marginTop: spacing.xl * 2 },
});
