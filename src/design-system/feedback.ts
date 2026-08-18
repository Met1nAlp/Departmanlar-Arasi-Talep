// src/design-system/feedback.ts
import * as Haptics from 'expo-haptics';

// NOT: Ses dosyaları (assets/sounds/*.mp3) henüz projeye eklenmedi.
// Ekip gerçek ses varlıklarını sağladığında bu dosya güncellenip
// expo-av ile ses çalma kısmı geri eklenecek. Şimdilik sadece haptik.

export async function successFeedback() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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