// src/infrastructure/sync/instance.ts
//
// OutboxWorker'ın uygulama genelindeki TEK örneği (RealtimeClient singleton'ıyla
// aynı desen — bkz. infrastructure/realtime/instance.ts).
//
// `dispatch`, entry.operation'a göre gerçek mepsanServerClient çağrılarına
// yönlendiriyor. CREATE_REQUEST, UPDATE_REQUEST_STATUS, CANCEL_REQUEST ve
// REJECT_REQUEST artık gerçek sunucu komutlarına bağlı (Barış'ın API
// dokümanı, 2026-08-21). Eski legacy isimler (ACKNOWLEDGE/READY/CLOSE/CANCEL —
// Efe'nin 14 durumlu modelinden kalma, gerçek protokolle örtüşmüyor) hâlâ
// backend'de karşılığı olmadığı için kalıcı hata döndürülüyor.

import { database } from '../db';
import { OutboxWorker, type Dispatch } from './OutboxWorker';
import { useConnectionStore } from '../../store/connectionStore';
import { mepsanServerClient } from '../mepsanServer/instance';
import { buildCreateRequestPayload } from '../mepsanServer/mappers';
import type { Request } from '../../types';

const dispatch: Dispatch = async (entry) => {
  if (entry.operation === 'CREATE_REQUEST') {
    console.log('[REQUEST] CREATE_REQUEST sunucuya gönderiliyor:', entry.targetId);
    const response = await mepsanServerClient.send(
      'CREATE_REQUEST',
      buildCreateRequestPayload(entry.payload as Request)
    );
    console.log('[REQUEST] CREATE_REQUEST cevabı:', response.status, response.message ?? '');
    if (response.status === 'ok') return { ok: true };
    return { ok: false, statusCode: 422, message: response.message ?? 'CREATE_REQUEST reddedildi' };
  }

  // YENİ: durum güncellemeleri de kuyruğa girip senkronize olabilsin diye.
  // entry.payload zaten { id, status, timestamp_field, timestamp_value }
  // şeklinde geliyor (bkz. api/requests.ts -> buildUpdateStatusPayload).
    if (entry.operation === 'UPDATE_REQUEST_STATUS') {
    console.log('[REQUEST] UPDATE_REQUEST_STATUS sunucuya gönderiliyor:', entry.targetId);
    const response = await mepsanServerClient.send(
      'UPDATE_REQUEST_STATUS',
      entry.payload as Record<string, unknown>
    );
    console.log('[REQUEST] UPDATE_REQUEST_STATUS cevabı:', response.status, response.message ?? '');
    if (response.status === 'ok') return { ok: true };
    return { ok: false, statusCode: 422, message: response.message ?? 'UPDATE_REQUEST_STATUS reddedildi' };
  }

  if (entry.operation === 'CANCEL_REQUEST') {
    console.log('[REQUEST] CANCEL_REQUEST sunucuya gönderiliyor:', entry.targetId);
    const response = await mepsanServerClient.send(
      'CANCEL_REQUEST',
      entry.payload as Record<string, unknown>
    );
    console.log('[REQUEST] CANCEL_REQUEST cevabı:', response.status, response.message ?? '');
    if (response.status === 'ok') return { ok: true };
    return { ok: false, statusCode: 422, message: response.message ?? 'CANCEL_REQUEST reddedildi' };
  }

  if (entry.operation === 'REJECT_REQUEST') {
    console.log('[REQUEST] REJECT_REQUEST sunucuya gönderiliyor:', entry.targetId);
    const response = await mepsanServerClient.send(
      'REJECT_REQUEST',
      entry.payload as Record<string, unknown>
    );
    console.log('[REQUEST] REJECT_REQUEST cevabı:', response.status, response.message ?? '');
    if (response.status === 'ok') return { ok: true };
    return { ok: false, statusCode: 422, message: response.message ?? 'REJECT_REQUEST reddedildi' };
  }

  if (entry.operation === 'FULFILL_REQUEST') {
    console.log('[FULFILL] sunucuya gönderiliyor:', JSON.stringify(entry.payload));
    const response = await mepsanServerClient.send(
      'FULFILL_REQUEST',
      entry.payload as Record<string, unknown>
    );
    console.log('[FULFILL] sunucu cevabı:', JSON.stringify(response));
    if (response.status === 'ok') return { ok: true };
    return { ok: false, statusCode: 422, message: response.message ?? 'FULFILL_REQUEST reddedildi' };
  }
  
  // Backend'de henüz karşılığı olmayan legacy operasyonlar (ACKNOWLEDGE,
  // CLOSE, CANCEL vb.) — tekrar denemenin anlamı yok, kalıcı hata say.
  return { ok: false, statusCode: 501, message: `"${entry.operation}" backend'de henüz desteklenmiyor` };
};



export const outboxWorker = new OutboxWorker(database, dispatch);

// KRİTİK: WebSocket kendi kendine yeniden bağlanabiliyor (backoff ile) ama
// bu, outbox kuyruğunu OTOMATİK boşaltmıyor — bağlantı koptuktan sonra
// tekrar kurulduğunda, kullanıcı başka bir işlem yapmadıkça ya da uygulamayı
// yeniden başlatmadıkça, offline'ken oluşturulan talepler sonsuza kadar
// kuyrukta bekleyip hiç gönderilmeyebiliyordu. Bu abonelik, bağlantı her
// CONNECTED olduğunda kuyruğu otomatik işlemeyi dener.
mepsanServerClient.onStateChange((state) => {
  if (state === 'CONNECTED') {
    void outboxWorker.processQueue().then(refreshPendingSyncBadge);
  }
});

/** Plan §12.4 kural 6: ConnectionBanner'daki "Senkronize edilecek: N" rozetini günceller. */
export async function refreshPendingSyncBadge(): Promise<void> {
  const count = await outboxWorker.getPendingCount();
  useConnectionStore.getState().setPendingSyncCount(count);
}
