// src/infrastructure/mepsanServer/instance.ts
//
// MepsanServerClient'ın uygulama genelindeki TEK örneği (RealtimeClient/
// OutboxWorker singleton'larıyla aynı desen).
//
// MAC ADRESİ NOTU (geçici — Adım 6'ya kadar): backend her mesajda gerçek bir
// mac_address bekliyor ama uygulamada henüz gerçek bir MAC/cihaz-kimlik akışı
// yok. Şimdilik deviceStore.deviceUid'i (zaten var olan, kalıcı üretilmiş
// cihaz kimliği) mac_address YERİNE geçici olarak kullanıyoruz. Adım 6'da
// gerçek MAC modeline geçilince burada tek satır değişecek.
//
// OLAY KÖPRÜSÜ: Sunucunun REQUEST_CREATED/REQUEST_STATUS_UPDATED broadcast'leri,
// orijinal komutun (snake_case, EKSİK alanlı) ham gövdesini taşıyor — tam bir
// Request objesi değil (örn. REQUEST_STATUS_UPDATED payload'ında sadece
// id/status/timestamp_field/timestamp_value var, departmentId/productId yok).
// Bu yüzden olay geldiğinde eldeki payload'ı Request'e "uydurmaya" ÇALIŞMIYORUZ
// — bunun yerine id'yi alıp GET_REQUESTS ile talebi TAM haliyle yeniden
// çekiyoruz, sonra emitRequestStatusChanged'a onu veriyoruz. Ekstra bir
// round-trip ama tek doğru kaynak (Request tipini asla eksik/hatalı doldurmuyoruz).

import { MepsanServerClient, type MepsanEventEnvelope } from './MepsanServerClient';
import { MEPSAN_SERVER_URL, isMepsanServerConfigured, MEPSAN_DEFAULT_PASSKEY } from '../../config/mepsanServerConfig';
import { mapServerRequestToRequest } from './mappers';
import { emitRequestStatusChanged } from '../../api/socketEvents';
import { useDeviceStore } from '../../store/deviceStore';
import { useConnectionStore } from '../../store/connectionStore';
import { User } from '../../types';

export const mepsanServerClient = new MepsanServerClient({
  url: MEPSAN_SERVER_URL,
  getMacAddress: () => useDeviceStore.getState().deviceUid,
});

// Plan Bölüm 9.2 deseniyle tutarlı: bağlantı durumu her zaman görünür olmalı.
mepsanServerClient.onStateChange((status) => useConnectionStore.getState().setStatus(status));

/** GET_REQUESTS'i filtresiz çağırıp id'ye göre bulur — GET_REQUEST_BY_ID komutu yok. */
export async function fetchRequestById(id: string) {
  const response = await mepsanServerClient.send('GET_REQUESTS', { user_id: '', department_id: '' });
  if (response.status !== 'ok') return undefined;
  const data = Array.isArray(response.data) ? response.data : [];
  const raw = data.find((item) => (item as Record<string, unknown>).id === id);
  return raw ? mapServerRequestToRequest(raw as Record<string, unknown>) : undefined;
}

mepsanServerClient.onEvent((event: MepsanEventEnvelope) => {
  if (event.event_name !== 'REQUEST_CREATED' && event.event_name !== 'REQUEST_STATUS_UPDATED') return;
  const id = event.payload?.id;
  if (typeof id !== 'string' || !id) return;

  void fetchRequestById(id).then((request) => {
    if (request) emitRequestStatusChanged(request);
  });
});

export function connectMepsanServer(user: User): void {
  if (!isMepsanServerConfigured) return; // Sunucu adresi yapılandırılmamış — bkz. mepsanServerConfig.ts.
  void mepsanServerClient
    .connect()
    .then(() => {
      const deviceUid = useDeviceStore.getState().deviceUid;
      if (!deviceUid) return; // Cihaz henüz kayıtlı değil (bkz. deviceStore) — auth'u atla.
      return mepsanServerClient.authenticate({
        deviceId: deviceUid, // geçici: gerçek device_id akışı Adım 6'da
        username: user.name,
        passkey: MEPSAN_DEFAULT_PASSKEY,
      });
    })
    .catch(() => {
      // Bağlantı/authenticate hatası — connectionStore zaten DISCONNECTED/
      // RECONNECTING durumunu üstleniyor (onStateChange), burada ekstra bir
      // şey yapmaya gerek yok; MepsanServerClient kendi backoff'uyla dener.
    });
}

export function disconnectMepsanServer(): void {
  mepsanServerClient.disconnect();
}
