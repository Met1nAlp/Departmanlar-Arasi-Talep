// src/design-system/components/ConnectionBanner.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { colors, spacing } from '../tokens';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface Props {
  status: ConnectionStatus;
  /**
   * Plan Bölüm 7.4: outbox'ta bekleyen kayıt sayısı ("Senkronize edilecek: 3").
   * 0'dan büyükse bağlantı sağlamken bile bant gösterilir — kullanıcı henüz
   * gönderilmemiş işi olduğunu bilmeli.
   */
  pendingSyncCount?: number;
}

const statusConfig: Record<ConnectionStatus, { color: string; icon: string; label: string }> = {
  connected: { color: colors.blue, icon: 'wifi', label: 'Bağlı' },
  connecting: { color: colors.warning, icon: 'sync', label: 'Bağlanıyor...' },
  disconnected: { color: colors.danger, icon: 'cloud-offline-outline', label: 'Bağlantı Yok — Çevrimdışı Çalışılıyor' },
};

// Saf/stateless sunum katmanı — store'a bağlanan kapsayıcı
// src/components/ConnectionBanner.tsx'tir (RealtimeClient durumunu oradan alır).
// Bu ayrım sayesinde bant, store kurulmadan da tek başına test edilebilir.
export function ConnectionBanner({ status, pendingSyncCount = 0 }: Props) {
  // Her şey yolunda VE bekleyen senkronizasyon yoksa bant hiç gösterilmez.
  if (status === 'connected' && pendingSyncCount === 0) return null;

  const config = statusConfig[status];

  return (
    <View style={[styles.banner, { backgroundColor: config.color }]}>
      <Ionicons name={config.icon as any} size={16} color={colors.white} />
      <Text variant="caption" color="white" style={styles.label}>
        {config.label}
      </Text>
      {pendingSyncCount > 0 && (
        <Text variant="caption" color="white" style={styles.label}>
          · Senkronize edilecek: {pendingSyncCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: {
    marginLeft: spacing.xs,
  },
});