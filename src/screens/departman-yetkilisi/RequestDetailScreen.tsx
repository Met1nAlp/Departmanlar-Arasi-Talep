// src/screens/departman-yetkilisi/RequestDetailScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import StatusBadge from '../../components/StatusBadge';
import { getRequestById, updateRequestStatus } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { sendFulfillRequest } from '../../infrastructure/realtime/MepsanService';
import { useActiveUser } from '../../store/authStore';
import { priorityLabels, priorityColors } from '../../utils/statusLabels';
import {
  LEGACY_NEXT_STATUS,
  LEGACY_NEXT_ACTION_LABEL,
  canAdvanceLegacyStatus,
  LegacyStatus,
} from '../../domain/request/legacyAdapter';

type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'RequestDetail'>;

export default function RequestDetailScreen() {
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [productName, setProductName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Kısmi karşılama için state
  const [showFulfill, setShowFulfill] = useState(false);
  const [fulfilledQty, setFulfilledQty] = useState('');

  useEffect(() => {
    getRequestById(route.params.requestId).then(async (req) => {
      if (!req) return;
      setRequest(req);
      setFulfilledQty(String(req.quantity)); // varsayılan tam miktar
      const [product] = await getProductsByIds([req.productId]);
      setProductName(product?.name ?? '');
    });
  }, [route.params.requestId]);

  /** Normal durum ilerletme (TALEP_ALINDI → HAZIRLANIYOR → YOLDA vb.) */
  const handleAdvance = async () => {
    if (!request) return;
    const next = LEGACY_NEXT_STATUS[request.status as LegacyStatus];
    if (!next) return;
    setUpdating(true);
    const updated = await updateRequestStatus(request.id, next);
    setRequest(updated);
    setUpdating(false);
  };

  /** Kısmi veya tam karşılama */
  const handleFulfill = async () => {
    if (!request) return;
    const qty = Number(fulfilledQty);
    if (!qty || qty <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin.');
      return;
    }
    setUpdating(true);
    try {
      const isPartial = qty < request.quantity;
      await sendFulfillRequest(request.id, qty, isPartial ? 'KISMI_HAZIR' : 'HAZIR');
      setRequest((prev) => prev
        ? { ...prev, status: isPartial ? 'KISMI_HAZIR' : 'HAZIR', fulfilledQuantity: qty }
        : prev
      );
      setShowFulfill(false);
      Alert.alert(
        'Başarılı',
        isPartial
          ? `${qty} adet hazırlandı (Kısmi Karşılama). Personel bilgilendirildi.`
          : 'Talep tam olarak karşılandı. Personel bilgilendirildi.'
      );
    } catch (e) {
      Alert.alert('Hata', 'Karşılama işlemi başarısız oldu.');
    } finally {
      setUpdating(false);
    }
  };

  if (!request) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const next = LEGACY_NEXT_STATUS[request.status as LegacyStatus];
  const allowedToAdvance = user ? canAdvanceLegacyStatus(user.role) : false;
  const priority = request.priority ?? 'NORMAL';
  const isTerminal = ['TESLIM_EDILDI', 'IPTAL_EDILDI'].includes(request.status);
  const canFulfill = ['HAZIRLANIYOR'].includes(request.status) && allowedToAdvance;

  return (
    <View style={styles.container}>
      {/* Ürün Adı */}
      <Text style={[typography.h2, { color: colors.textPrimary }]}>{productName}</Text>

      {/* Detay Satırları */}
      <View style={styles.infoGrid}>
        <InfoRow label="İstenen Adet" value={String(request.quantity)} />
        {request.fulfilledQuantity != null && request.fulfilledQuantity > 0 && (
          <InfoRow
            label="Hazırlanan Adet"
            value={String(request.fulfilledQuantity)}
            highlight={request.fulfilledQuantity < request.quantity}
          />
        )}
        <InfoRow label="Talep Eden" value={request.requesterId} />
        <InfoRow label="Oluşturulma" value={new Date(request.createdAt).toLocaleString('tr-TR')} />
      </View>

      {/* Öncelik Rozeti */}
      <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
        <Text style={{ color: colors.white, fontWeight: '700' }}>{priorityLabels[priority]}</Text>
      </View>

      {/* Durum */}
      <View style={{ marginTop: spacing.md }}>
        <StatusBadge status={request.status} />
      </View>

      {/* Kısmi Karşılama Paneli */}
      {canFulfill && (
        <View style={styles.fulfillBox}>
          {!showFulfill ? (
            <TouchableOpacity style={styles.fulfillToggleBtn} onPress={() => setShowFulfill(true)}>
              <Text style={{ color: colors.blue, fontWeight: '600' }}>📦 Karşılama Miktarı Gir</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                Kaç adet hazır? (İstenen: {request.quantity})
              </Text>
              <TextInput
                style={styles.input}
                value={fulfilledQty}
                onChangeText={setFulfilledQty}
                keyboardType="number-pad"
                placeholder={String(request.quantity)}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.blue, flex: 1 }]} onPress={handleFulfill} disabled={updating}>
                  {updating ? <ActivityIndicator color={colors.white} /> : (
                    <Text style={{ color: colors.white, fontWeight: '600' }}>Onayla</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => setShowFulfill(false)}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>İptal</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Normal Durum İlerletme */}
      {next && allowedToAdvance && !canFulfill && !isTerminal ? (
        <TouchableOpacity style={styles.actionButton} onPress={handleAdvance} disabled={updating}>
          {updating ? <ActivityIndicator color={colors.white} /> : (
            <Text style={{ color: colors.white, fontWeight: '600' }}>{LEGACY_NEXT_ACTION_LABEL[request.status as LegacyStatus]}</Text>
          )}
        </TouchableOpacity>
      ) : isTerminal ? (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.lg }]}>
          Bu talep tamamlandı veya iptal edildi.
        </Text>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.caption, { color: highlight ? colors.orange : colors.textPrimary, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.lg },
  infoGrid: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  priorityBadge: {
    alignSelf: 'flex-start', marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.lg,
  },
  actionButton: {
    marginTop: spacing.xl, backgroundColor: colors.blue, padding: spacing.md,
    borderRadius: radius.md, alignItems: 'center',
  },
  fulfillBox: {
    marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  fulfillToggleBtn: { alignItems: 'center', padding: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.white,
  },
  btn: { padding: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
});