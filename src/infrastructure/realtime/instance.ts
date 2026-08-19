// src/infrastructure/realtime/instance.ts
//
// RealtimeClient'ın uygulama genelinde TEK örneği (singleton).
// Backend: MepsanServer (C++ Qt) — ws://HOST:PORT — raw WebSocket.
//
// Cihaz kimliği olarak expo-device veya uuid tabanlı kalıcı bir ID kullanılır.
// Backend'de bu değer "mac_address" alanına karşılık gelir (serverhandler.cpp).
//
// `connectRealtime`/`disconnectRealtime` RootNavigator tarafından
// activeSession'ın var/yok olma durumuna göre çağrılır.
// Backend WS ucu yoksa (`isRealtimeConfigured === false`) connect() hiçbir şey yapmaz.

import { RealtimeClient } from './RealtimeClient';
import { REALTIME_WS_URL, isRealtimeConfigured } from '../../config/realtimeConfig';
import { useConnectionStore } from '../../store/connectionStore';
import { getOrCreateDeviceId } from '../security/deviceId';

export const realtimeClient = new RealtimeClient({
  url: REALTIME_WS_URL,
  // Her mesajda backend'e gönderilecek cihaz kimliği.
  // Backend bunu "mac_address" alanı olarak doğrular (serverhandler.cpp).
  getDeviceId: () => getOrCreateDeviceId(),
});

// Bağlantı durumu her zaman görünür olmalı — connectionStore üzerinden UI'a yansır.
realtimeClient.onStateChange((status) => useConnectionStore.getState().setStatus(status));

export function connectRealtime(): void {
  if (!isRealtimeConfigured) return;
  realtimeClient.connect();
}

export function disconnectRealtime(): void {
  realtimeClient.disconnect();
}
