// src/infrastructure/realtime/instance.ts
//
// RealtimeClient'ın uygulama genelinde TEK örneği (singleton). Plan Bölüm 9.2
// "subscribe {channels: ['dept:MONTAJ-1', 'user:1042']}" kanal sözleşmesini
// mevcut legacy User tipinden (src/types/index.ts) üretir.
//
// `connectRealtime`/`disconnectRealtime` RootNavigator tarafından
// activeSession'ın var/yok olma durumuna göre çağrılır (bkz. Task #10).
// Backend WS ucu henüz yoksa (`isRealtimeConfigured === false`) connect()
// hiçbir şey yapmaz — bkz. realtimeConfig.ts.

import { RealtimeClient } from './RealtimeClient';
import { REALTIME_WS_URL, isRealtimeConfigured } from '../../config/realtimeConfig';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { User } from '../../types';

export const realtimeClient = new RealtimeClient({
  url: REALTIME_WS_URL,
  // authStore dışında (React dışı) çağrıldığı için hook değil, doğrudan
  // store erişimi (getState) kullanılır — zustand'ın önerdiği desen.
  getToken: () => null,
});

// Plan Bölüm 9.2: bağlantı durumu her zaman görünür olmalı. Tek örnek olduğu
// için bu dinleme modül yüklenir yüklenmez, uygulama boyunca bir kez kurulur.
realtimeClient.onStateChange((status) => useConnectionStore.getState().setStatus(status));

/** Plan Bölüm 9.2 kanal adlandırması: "dept:<kod>" ve "user:<id>". */
export function buildChannelsForUser(user: User): string[] {
  const channels = [`user:${user.id}`];
  if (user.departmentId) channels.push(`dept:${user.departmentId}`);
  return channels;
}

export function connectRealtime(user: User): void {
  if (!isRealtimeConfigured) return; // Backend WS ucu yok — bkz. dosya başı notu.
  realtimeClient.subscribe(buildChannelsForUser(user));
  void realtimeClient.connect();
}

export function disconnectRealtime(): void {
  realtimeClient.disconnect();
}
