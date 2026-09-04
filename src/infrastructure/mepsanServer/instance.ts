// src/infrastructure/mepsanServer/instance.ts
//
// MepsanServerClient'ın uygulama genelindeki TEK örneği (RealtimeClient/
// OutboxWorker singleton'larıyla aynı desen).
//
// SERİ NUMARASI NOTU: backend artık MAC adresi değil, cihazın seri numarasını
// (serial_number) bekliyor. deviceStore.deviceUid alanı, kullanıcının elle
// girdiği seri numarasını tutar ve her mesajda serial_number olarak gönderilir.
//
// OLAY KÖPRÜSÜ: Sunucunun REQUEST_CREATED/REQUEST_STATUS_UPDATED broadcast'leri,
// orijinal komutun (snake_case, EKSİK alanlı) ham gövdesini taşıyor — tam bir
// Request objesi değil (örn. REQUEST_STATUS_UPDATED payload'ında sadece
// id/status/timestamp_field/timestamp_value var, departmentId/productId yok).
// Bu yüzden olay geldiğinde eldeki payload'ı Request'e "uydurmaya" ÇALIŞMIYORUZ
// — bunun yerine id'yi alıp GET_REQUESTS ile talebi TAM haliyle yeniden
// çekiyoruz, sonra emitRequestStatusChanged'a onu veriyoruz. Ekstra bir
// round-trip ama tek doğru kaynak (Request tipini asla eksik/hatalı doldurmuyoruz).
//
// USER_DELETED (henüz backend'de YOK — Barış eklemeli): bir kullanıcı
// veritabanından silindiğinde sunucu diğer broadcast'lerle aynı zarfla
// { type: "event", event_name: "USER_DELETED", payload: { id } } yayınlamalı.
// Mobil taraf bunu aşağıda dinliyor; backend event'i göndermeye başladığı an
// hiçbir kod değişikliği gerekmeden devreye girer.

import { Alert, AppState } from 'react-native';
import { MepsanServerClient, type MepsanEventEnvelope } from './MepsanServerClient';
import { MEPSAN_SERVER_URL, isMepsanServerConfigured, MEPSAN_DEFAULT_PASSKEY } from '../../config/mepsanServerConfig';
import { mapServerRequestToRequest } from './mappers';
import { emitRequestStatusChanged } from '../../api/socketEvents';
import { useDeviceStore } from '../../store/deviceStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';

export const mepsanServerClient = new MepsanServerClient({
  url: MEPSAN_SERVER_URL,
  getSerialNumber: () => useDeviceStore.getState().deviceUid,
});

// Plan Bölüm 9.2 deseniyle tutarlı: bağlantı durumu her zaman görünür olmalı.
mepsanServerClient.onStateChange((status) => {
  console.log('[WS] durum değişti:', status);
  useConnectionStore.getState().setStatus(status);
});

/** GET_REQUESTS'i filtresiz çağırıp id'ye göre bulur — GET_REQUEST_BY_ID komutu yok. */
export async function fetchRequestById(id: string) {
  const response = await mepsanServerClient.send('GET_REQUESTS', { user_id: '', department_id: '' });
  if (response.status !== 'ok') return undefined;
  const data = Array.isArray(response.data) ? response.data : [];
  const raw = data.find((item) => (item as Record<string, unknown>).id === id);
  return raw ? mapServerRequestToRequest(raw as Record<string, unknown>) : undefined;
}

mepsanServerClient.onEvent((event: MepsanEventEnvelope) => {
  console.log('[WS] olay geldi:', event.event_name);

  if (event.event_name === 'USER_DELETED') {
    const deletedUserId = String(event.payload?.id ?? '');
    const currentUser = useAuthStore.getState().currentUser;
    if (deletedUserId && currentUser && String(currentUser.id) === deletedUserId) {
      console.log('[AUTH] USER_DELETED bu kullanıcıyla eşleşti, logout ediliyor');
      useAuthStore.getState().logout();
      Alert.alert('Hesabınız kaldırıldı', 'Hesabınız sistemden kaldırıldı. Devam etmek için tekrar giriş yapmanız gerekiyor.');
    }
    return;
  }

  if (event.event_name !== 'REQUEST_CREATED' && event.event_name !== 'REQUEST_STATUS_UPDATED') return;
  const id = event.payload?.id;
  if (typeof id !== 'string' || !id) return;

  void fetchRequestById(id).then((request) => {
    if (request) {
      console.log('[REQUEST] güncelleme yayına düştü:', id, '→', request.status);
      emitRequestStatusChanged(request);
    }
  });
});

// AUTH_REQUEST'e artık gerek yok — seri numarası, Barış tarafından doğrudan
// veritabanına ekleniyor (kayıt kodu/onboarding akışı yok). Sunucu, her
// komutta serial_number'ı kontrol ediyor; seri numarası tabloda
// varsa herhangi bir komut (CARD_LOGIN dahil) zaten çalışır. Bu yüzden
// burada sadece WebSocket bağlantısını kuruyoruz — asıl "yetkili mi değil
// mi" sorusunun gerçek cevabı, ilk komut (CardLoginScreen'deki CARD_LOGIN)
// gönderildiğinde sunucudan gelecek.
export function connectMepsanServer(): void {
  console.log('[WS] connectMepsanServer() çağrıldı');
  if (!isMepsanServerConfigured) {
    console.log('[WS] sunucu adresi ayarlı değil, bağlanılmıyor');
    useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    return;
  }
  const deviceUid = useDeviceStore.getState().deviceUid;
  if (!deviceUid) {
    console.log('[WS] cihaz seri numarası yok, bağlanılmıyor');
    useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    return;
  }

  useConnectionStore.getState().setDeviceAuthStatus('authorizing');

  void mepsanServerClient
    .connect()
    .then(() => {
      // Bağlantı kuruldu — MAC yetkili mi değil mi burada henüz bilmiyoruz,
      // ama artık CardLoginScreen'e geçebiliriz, gerçek kontrol orada olur.
      console.log('[WS] bağlantı kuruldu');
      useConnectionStore.getState().setDeviceAuthStatus('authorized');
    })
    .catch((err) => {
      console.log('[WS] bağlantı kurulamadı:', err instanceof Error ? err.message : err);
      useConnectionStore.getState().setDeviceAuthStatus('unauthorized');
    });
}

export function disconnectMepsanServer(): void {
  console.log('[WS] disconnectMepsanServer() çağrıldı');
  mepsanServerClient.disconnect();
}

// Uygulama arka plandan öne geldiğinde (ekran kapat/aç, uygulamalar arası
// geçiş) WebSocket bağlantısı OS tarafından koparılmış olabilir — bu durumda
// backoff süresini beklemeden hemen yeniden bağlanmayı dener. connect() zaten
// var olan bir soket varsa hiçbir şey yapmadan döner, o yüzden burada tekrar
// çağırmak zararsız (idempotent).
AppState.addEventListener('change', (nextState) => {
  console.log('[APP] durum değişti:', nextState);
  if (nextState === 'active') {
    connectMepsanServer();
  }
});
