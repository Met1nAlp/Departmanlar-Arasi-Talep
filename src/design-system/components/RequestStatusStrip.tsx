// src/design-system/components/RequestStatusStrip.tsx
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../primitives/Text';
import { statusTokens, colors, spacing } from '../tokens';
import { RequestStatusKey } from '../tokens';
import { statusOrder } from '../../utils/statusLabels';

interface Props {
  currentStatus: RequestStatusKey;
}

// PDF Bölüm 16.6'daki imza bileşen — RequestTrackingScreen'deki eski nokta
// listesinin yerini alır. Her adım: ikon + etiket, geçilmiş adımlar dolu,
// gelecek adımlar soluk.
export function RequestStatusStrip({ currentStatus }: Props) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <View style={styles.container}>
      {statusOrder.map((status, index) => {
        const token = statusTokens[status];
        const isDone = index <= currentIndex;
        const isLast = index === statusOrder.length - 1;

        return (
          <View key={status} style={styles.step}>
            <View style={styles.row}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDone ? token.bgColor : colors.surface },
                ]}
              >
                <Ionicons
                  name={token.icon as any}
                  size={18}
                  color={isDone ? token.color : colors.textMuted}
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: index < currentIndex ? colors.blue : colors.border },
                  ]}
                />
              )}
            </View>
            <Text
              variant="caption"
              color={isDone ? 'textPrimary' : 'textMuted'}
              style={styles.label}
            >
              {token.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 3,
    marginHorizontal: 2,
  },
  label: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});