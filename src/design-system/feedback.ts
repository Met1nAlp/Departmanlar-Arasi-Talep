// src/design-system/feedback.ts
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const successSound = require('../../assets/sounds/success.wav');
const scanSound = require('../../assets/sounds/scan.wav');

/**
 * Kısa bir ses efektini bir kereliğine çalıp kaynağı serbest bırakır.
 * `createAudioPlayer` her çağrıda yeni bir player döndürüyor — component
 * ömrüne bağlı olmadığı için (buton onPress'i gibi component dışı yerlerden
 * de çağrılabiliyor) çalma bitince `remove()` ile elle temizliyoruz, aksi
 * halde expo-audio dokümantasyonunun uyardığı gibi bellek sızıntısı olur.
 */
function playOnce(source: number): void {
  const player: AudioPlayer = createAudioPlayer(source);
  const subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      subscription.remove();
      player.remove();
    }
  });
  player.play();
}

export async function successFeedback() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  playOnce(successSound);
}

export async function errorFeedback() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export async function warningFeedback() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export async function tapFeedback() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * NFC kartı algılanır algılanmaz (henüz doğrulanmadan) çağrılır — kullanıcı
 * kartı cihazdan çekip "Doğrulanıyor" ekranını beklemeye başlasın diye anlık
 * bir onay verir. Bilerek successFeedback'ten FARKLI bir ses/doku kullanıyor
 * — "algılandı, bekle" ile "giriş başarılı" birbirine karışmasın.
 */
export async function cardDetectedFeedback() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  playOnce(scanSound);
}