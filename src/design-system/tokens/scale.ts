// src/design-system/tokens/scale.ts
//
// POS cihazları hedef kitle — çözünürlükleri modelden modele değişiyor
// (480x800'den biraz büyüğe kadar). Bu yüzden "büyük tasarımdan küçültme"
// değil, KÜÇÜK ekranı referans alıp orana göre ölçekleme + alt/üst sınır
// (clamp) yaklaşımı kullanıyoruz — hem en küçük POS'ta okunabilir kalsın
// hem de daha büyük POS'ta aşırı büyümesin.

import { Dimensions } from 'react-native';

const REFERENCE_WIDTH = 360; // küçük POS ekranlarına yakın referans
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.15;

const { width: screenWidth } = Dimensions.get('window');

const rawScale = screenWidth / REFERENCE_WIDTH;
const clampedScale = Math.min(Math.max(rawScale, MIN_SCALE), MAX_SCALE);

/** Bir piksel değerini cihaz genişliğine göre (sınırlar dahilinde) ölçekler. */
export function scale(size: number): number {
  return Math.round(size * clampedScale);
}