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

// AUTH_REQUEST'e artık gerek yok — MAC, Barış tarafından doğrudan
// veritabanına ekleniyor (kayıt kodu/onboarding akışı yok). Sunucu, her
// komutta mac_address'i isMacAuthorized ile kontrol ediyor; MAC tabloda
// varsa herhangi bir komut (CARD_LOGIN dahil) zaten çalışır. Bu yüzden
// burada sadece WebSocket bağlantısını kuruyoruz — asıl "yetkili mi değil
// mi" sorusunun gerçek cevabı, ilk komut (CardLoginScreen'deki CARD_LOGIN)
// gönderildiğinde sunucudan gelecek.
export function connectMepsanServer(): void {
  if (!isMepsanServerConfigured) {
    useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    return;
  }
  const deviceUid = useDeviceStore.getState().deviceUid;
  if (!deviceUid) {
    useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    return;
  }

  useConnectionStore.getState().setDeviceAuthStatus('authorizing');

  void mepsanServerClient
    .connect()
    .then(() => {
      // Bağlantı kuruldu — MAC yetkili mi değil mi burada henüz bilmiyoruz,
      // ama artık CardLoginScreen'e geçebiliriz, gerçek kontrol orada olur.
      useConnectionStore.getState().setDeviceAuthStatus('authorized');
    })
    .catch(() => {
      useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    });
}

export function disconnectMepsanServer(): void {
  mepsanServerClient.disconnect();
}
