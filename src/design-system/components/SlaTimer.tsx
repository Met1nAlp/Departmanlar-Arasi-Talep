// src/design-system/components/SlaTimer.tsx
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { colors, spacing } from '../tokens';

interface Props {
  dueAt: string; // ISO 8601 — Efe'nin SlaPolicy.ts hesapladığı tarih
}

// SLA'nın %70'i geçtiğinde turuncuya, süre dolduğunda kırmızıya döner (PDF'in
// "SLA %70'te turuncu yanıp sönme" kuralı — yanıp sönme animasyonu M2 sonrası eklenebilir).
export function SlaTimer({ dueAt }: Props) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(dueAt).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(new Date(dueAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [dueAt]);

  const isOverdue = remainingMs <= 0;
  const minutes = Math.floor(Math.abs(remainingMs) / 60000);
  const seconds = Math.floor((Math.abs(remainingMs) % 60000) / 1000);
  const label = `${isOverdue ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Ionicons
        name={isOverdue ? 'alert-circle' : 'time-outline'}
        size={14}
        color={isOverdue ? colors.danger : colors.textSecondary}
      />
      <Text variant="caption" color={isOverdue ? 'textPrimary' : 'textSecondary'} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 4,
  },
});