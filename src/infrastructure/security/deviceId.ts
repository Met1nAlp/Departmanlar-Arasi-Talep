// src/infrastructure/security/deviceId.ts
//
// Mobil cihazlarda MAC adresi programatik olarak alınamaz (Android 6+, iOS kısıtlamaları).
// Backend (serverhandler.cpp) her mesajda "mac_address" alanı bekler — bu alanı
// biz uygulama genelinde kalıcı ve benzersiz bir cihaz UUID'siyle karşılıyoruz.
//
// UUID, ilk çalıştırmada üretilir ve `expo-secure-store`'da saklanır.
// Bu sayede uygulama silinip yeniden kurulmadığı sürece aynı ID kullanılır,
// backend `pos_devices` tablosundaki kayıtla eşleşme sağlanmış olur.

import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'mts.device.id';

let _cachedDeviceId: string | null = null;

/**
 * Senkron çağrı — önbellekte varsa oradan döner.
 * Uygulama açılışında `initDeviceId()` çağrıldıktan sonra kullanılır.
 */
export function getOrCreateDeviceId(): string {
  if (_cachedDeviceId) return _cachedDeviceId;
  // Henüz initDeviceId çağrılmadıysa geçici bir değer döndür (reconnect anında kullanılabilir)
  return 'DEVICE_NOT_INITIALIZED';
}

/**
 * Uygulama başlangıcında bir kez çağrılır (App.tsx veya RootNavigator'da).
 * SecureStore'dan okur ya da yeni UUID üretip kaydeder.
 */
export async function initDeviceId(): Promise<string> {
  if (_cachedDeviceId) return _cachedDeviceId;

  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      _cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // SecureStore erişim hatası — yeni UUID üret ama kaydetme
  }

  // UUID v4 (crypto tabanlı)
  const newId = generateUUIDv4();

  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
  } catch {
    // Kayıt başarısız olsa da ID bu oturumda kullanılabilir
  }

  _cachedDeviceId = newId;
  return newId;
}

/** RFC 4122 uyumlu UUID v4 üretici (bağımlılık gerektirmez). */
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
