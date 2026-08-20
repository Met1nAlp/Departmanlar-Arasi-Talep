// src/config/mepsanServerConfig.ts
//
// Barış'ın Qt/C++ WebSocket sunucusunun adresi. realtimeConfig.ts'teki aynı
// desen: app.json -> expo.extra.mepsanServerUrl boşsa bağlanmaya HİÇ
// teşebbüs edilmez.
//
// Sunucu hazır olduğunda tek yapılacak şey: app.json'a
//   "extra": { "mepsanServerUrl": "ws://192.168.1.50:1234" }
// eklemek (1234 = main.cpp'deki server_config.ini varsayılan portu).
// Kod tarafında hiçbir değişiklik gerekmez.

import Constants from 'expo-constants';

function readConfiguredUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const url = extra?.mepsanServerUrl;
  return typeof url === 'string' ? url.trim() : '';
}

export const MEPSAN_SERVER_URL = readConfiguredUrl();

/** false ise MepsanServerClient hiç connect() çağırmaz. */
export const isMepsanServerConfigured = MEPSAN_SERVER_URL.length > 0;

/** Backend'de tanımlı varsayılan AUTH_REQUEST passkey'i (serverhandler.cpp). */
export const MEPSAN_DEFAULT_PASSKEY = 'MPSN1992';
