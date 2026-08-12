import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Request } from '../types';
import { colors, spacing, radius, typography } from '../constants/theme';
import StatusBadge from './StatusBadge';

interface Props {
  request: Request;
  productName: string;
  onPress?: () => void;
}

export default function RequestCard({ request, productName, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={[typography.body, { fontWeight: '600', color: colors.textPrimary }]}>{productName}</Text>
        <StatusBadge status={request.status} />
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Adet: {request.quantity}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});