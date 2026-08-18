// src/infrastructure/security/secureStorage.ts
//
// Plan Bölüm 14.3 "Token saklama": Android Keystore destekli react-native-keychain
// öneriliyor; Expo yönetilen akışta karşılığı expo-secure-store'dur (aynı garanti —
// donanım destekli şifreli depolama, AsyncStorage'da asla düz metin token yok).
//
// Bu dosya SecureStore'u doğrudan her yerde çağırmak yerine tek bir dar arayüz
// arkasına alır: anahtarlar burada sabitlenir (typo riski kalkar), ileride
// react-native-keychain'e geçilirse (bare workflow) tek dosya değişir.

import * as SecureStore from 'expo-secure-store';

/** Bu uygulamanın SecureStore'da kullandığı TÜM anahtarların tek kaynağı. */
export const SECURE_STORAGE_KEYS = {
  accessToken: 'mts.auth.accessToken',
  refreshToken: 'mts.auth.refreshToken',
  tokenExpiresAt: 'mts.auth.tokenExpiresAt',
  supervisorUser: 'mts.auth.supervisorUser',
  // Plan Bölüm 14.2 adım 1 "Cihaz kaydı (bir kez, kurulumda)" — bu anahtarlar
  // yetkili/personel oturumlarından bağımsızdır, cihaz fabrika ayarlarına
  // dönmeden silinmez (bkz. store/deviceStore.ts).
  deviceUid: 'mts.device.uid',
  deviceToken: 'mts.device.token',
  deviceDepartmentId: 'mts.device.departmentId',
  deviceMode: 'mts.device.mode',
} as const;

export type SecureStorageKey = (typeof SECURE_STORAGE_KEYS)[keyof typeof SECURE_STORAGE_KEYS];

export async function setSecureItem(key: SecureStorageKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: SecureStorageKey): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: SecureStorageKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/** Yalnızca yetkili/personel oturum anahtarları — device* KASITLI OLARAK hariç
 * (bkz. yukarıdaki not: cihaz kaydı, yetkili çıkışında silinmemeli). */
const AUTH_ONLY_KEYS: SecureStorageKey[] = [
  SECURE_STORAGE_KEYS.accessToken,
  SECURE_STORAGE_KEYS.refreshToken,
  SECURE_STORAGE_KEYS.tokenExpiresAt,
  SECURE_STORAGE_KEYS.supervisorUser,
];

/** Oturum kapatmada (Plan Bölüm 14.2, adım 4) tüm auth anahtarlarını tek seferde temizler. */
export async function clearAuthSecureStorage(): Promise<void> {
  await Promise.all(AUTH_ONLY_KEYS.map((key) => deleteSecureItem(key)));
}

/** Yalnızca BT/admin'in "cihazı fabrika ayarlarına döndür" akışında kullanılmalı. */
export async function clearDeviceSecureStorage(): Promise<void> {
  await Promise.all(
    [
      SECURE_STORAGE_KEYS.deviceUid,
      SECURE_STORAGE_KEYS.deviceToken,
      SECURE_STORAGE_KEYS.deviceDepartmentId,
      SECURE_STORAGE_KEYS.deviceMode,
    ].map((key) => deleteSecureItem(key)),
  );
}
