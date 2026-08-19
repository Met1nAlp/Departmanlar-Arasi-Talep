// src/components/StatusBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statusTokens, typography, radius } from '../design-system/tokens';
import { RequestStatus } from '../types';

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const token = statusTokens[status];

  return (
    <View style={[styles.badge, { backgroundColor: token.bgColor }]}>
      <Ionicons name={token.icon as any} size={14} color={token.color} style={styles.icon} />
      <Text style={[typography.caption, { color: token.color, fontWeight: '600' }]}>
        {token.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});