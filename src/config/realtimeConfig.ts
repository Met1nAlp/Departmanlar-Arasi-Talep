// src/config/realtimeConfig.ts
//
// Backend WS ucu henüz yok (bkz. RealtimeClient.ts dosya başı notu). Bu dosya
// gerçek zaman bağlantısının AÇIK/KAPALI olduğunu tek bir yerden karar verir:
// `app.json` -> expo.extra.realtimeWsUrl boşsa bağlanmaya HİÇ teşebbüs
// edilmez (sürekli başarısız reconnect döngüsüyle pil/ağ tüketmeyelim).
//
// Backend hazır olduğunda tek yapılacak şey: app.json'a
//   "extra": { "realtimeWsUrl": "wss://mts.mepsan.local/ws" }
// eklemek. Kod tarafında hiçbir değişiklik gerekmez.

import Constants from 'expo-constants';

function readConfiguredUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const url = extra?.realtimeWsUrl;
  return typeof url === 'string' ? url.trim() : '';
}

export const REALTIME_WS_URL = readConfiguredUrl();

/** false ise RealtimeClient hiç connect() çağırmaz — bkz. dosya başı notu. */
export const isRealtimeConfigured = REALTIME_WS_URL.length > 0;
