// src/design-system/components/SlaStrip.tsx
//
// Plan §16.6 "İmza öğesi — Durum Şeridi": her çağrı kartının sol kenarında,
// kart yüksekliği boyunca uzanan 4dp'lik renkli bir şerit. SLA tükendikçe
// aşağıdan yukarı dolar (kalan süre görselleşir), %70'i geçtiğinde nabız gibi
// yavaşça yanıp söner. Kuyruk ekranındaki TEK animasyon budur — bkz. plan notu:
// "Cesaret tek bir yere harcanır."
//
// Renk semantiği domain/request/SlaPolicy.ts'ten gelir (slaProgress,
// isNearSla, isSlaBreached) — bu bileşen saf sunumdur, SLA hesabı yapmaz.
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../tokens';

interface Props {
  /** 0 = yeni açıldı, 1 = süre doldu, >1 = aşıldı (bkz. SlaPolicy.slaProgress). */
  progress: number;
  /** SLA %70'i geçti mi (bkz. SlaPolicy.isNearSla) — true ise şerit yanıp söner. */
  isNearBreach: boolean;
  /** SLA aşıldı mı (bkz. SlaPolicy.isSlaBreached) — renk kırmızıya döner. */
  isBreached: boolean;
}

const STRIP_WIDTH = 4;

export function SlaStrip({ progress, isNearBreach, isBreached }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNearBreach) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isNearBreach, pulse]);

  const fillColor = isBreached ? colors.stateDanger : isNearBreach ? colors.stateActive : colors.statePending;
  const fillPct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            height: `${fillPct}%`,
            backgroundColor: fillColor,
            opacity: isNearBreach ? pulse : 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: STRIP_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
  },
});
