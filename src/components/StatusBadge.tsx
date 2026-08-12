import { View, Text, StyleSheet } from 'react-native';
import { RequestStatus } from '../types';
import { colors, statusColors, radius, typography } from '../constants/theme';
import { statusLabels } from '../utils/statusLabels';

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const isDark = status === 'YOLDA' || status === 'TESLIM_EDILDI';
  return (
    <View style={[styles.badge, { backgroundColor: statusColors[status] }]}>
      <Text style={[typography.caption, { color: isDark ? colors.white : colors.textPrimary, fontWeight: '600' }]}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
});