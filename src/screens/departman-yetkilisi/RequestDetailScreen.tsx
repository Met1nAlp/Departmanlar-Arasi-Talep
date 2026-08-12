import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RequestStatus } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import StatusBadge from '../../components/StatusBadge';
import { statusLabels } from '../../utils/statusLabels';

// Bir durumdan sonra hangi durumlara geçilebileceği (Departman Yetkilisi kontrolündeki adımlar)
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
  // GEÇİCİ: gerçek talep route.params.requestId ile backend'den çekilecek (Faz 2)
  const [status, setStatus] = useState<RequestStatus>('TALEP_ALINDI');
  const next = nextStatusMap[status];

  const handleAdvance = () => {
    if (next) setStatus(next);
    // Faz 2'de: api.updateRequestStatus(requestId, next) + bildirim tetikleme
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.textPrimary }]}>Vida Seti M6</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>Adet: 3</Text>
      <View style={{ marginTop: spacing.md }}>
        <StatusBadge status={status} />
      </View>

      {next ? (
        <TouchableOpacity style={styles.actionButton} onPress={handleAdvance}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>{nextActionLabel[status]}</Text>
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
  actionButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.blue,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});