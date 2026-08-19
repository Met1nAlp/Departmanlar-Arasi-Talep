// src/api/requests.ts
import { Request, RequestStatus } from '../types';
import { mockRequests } from '../mocks/requests';
import { emitRequestStatusChanged } from './socketEvents';
import { outboxWorker, refreshPendingSyncBadge } from '../infrastructure/sync/instance';
import { mepsanServerClient, fetchRequestById } from '../infrastructure/mepsanServer/instance';
import { mapServerRequestToRequest, buildUpdateStatusPayload } from '../infrastructure/mepsanServer/mappers';

// Backend sözleşmesi: GET_REQUESTS { user_id, department_id }
//
// Sunucuya bağlı değilsek (bkz. mepsanServerConfig.ts / bağlantı henüz
// kurulmadıysa) mockRequests'e düşüyoruz — ekranlar hiçbir zaman "kırık"
// bir liste görmesin diye (offline-first ruhu, Plan Bölüm 7.4).
export async function getRequests(params: { userId?: string; departmentId?: string }): Promise<Request[]> {
  try {
    const response = await mepsanServerClient.send('GET_REQUESTS', {
      user_id: params.userId ?? '',
      department_id: params.departmentId ?? '',
    });
    if (response.status !== 'ok') throw new Error(response.message ?? 'GET_REQUESTS başarısız');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((raw) => mapServerRequestToRequest(raw as Record<string, unknown>));
  } catch {
    return mockRequests.filter((r) =>
      params.userId ? r.requesterId === params.userId : params.departmentId ? r.departmentId === params.departmentId : true
    );
  }
}

// Backend sözleşmesi: GET_REQUESTS_BY_ID diye bir komut YOK — GET_REQUESTS'i
// filtresiz çağırıp id'ye göre buluyoruz (bkz. mepsanServer/instance.ts).
export async function getRequestById(id: string): Promise<Request | undefined> {
  try {
    const found = await fetchRequestById(id);
    if (found) return found;
  } catch {
    // sunucuya ulaşılamadı — aşağıda mock'a düşülüyor
  }
  return mockRequests.find((r) => r.id === id);
}

// Backend sözleşmesi: CREATE_REQUEST { id, requester_id, department_id, product_id, quantity, status, created_at }
//
// Plan Bölüm 7.4 (offline senaryosu): "Kullanıcı eylemi → Local'e yaz → UI
// anında güncellenir (optimistic update) → Outbox worker gönderir." Bu
// fonksiyon o akışı uyguluyor — çağrı önce yerel olarak (mockRequests)
// oluşturulur ve ekrana hemen yansır, gerçek gönderim OutboxWorker üzerinden
// arka planda yapılır (bkz. infrastructure/sync/instance.ts — dispatch artık
// mepsanServerClient'a CREATE_REQUEST gönderiyor).
export async function createRequest(input: {
  departmentId: string;
  productId: string;
  quantity: number;
  requesterId: string;
}): Promise<Request> {
  const newRequest: Request = {
    id: `r-${Date.now()}`,
    ...input,
    status: 'TALEP_ALINDI',
    deliveryMethod: 'elektrikli_transpalet',
    createdAt: new Date().toISOString(),
  };
  mockRequests.push(newRequest); // optimistic update — sunucu onayı beklenmez
  emitRequestStatusChanged(newRequest);

  // Tüm talep nesnesini kuyruğa koyuyoruz (sadece input değil) — OutboxWorker'ın
  // gerçek dispatch adımı CREATE_REQUEST komutu için id/status/createdAt'e de ihtiyaç duyuyor.
  await outboxWorker.enqueue('CREATE_REQUEST', newRequest.id, newRequest);
  await refreshPendingSyncBadge();
  // Kuyruğu hemen işlemeyi dene (arka planda) — bağlantı yoksa OutboxWorker
  // kendi backoff mantığıyla (Plan §12.4) daha sonra tekrar dener.
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return newRequest;
}

// Backend sözleşmesi: UPDATE_REQUEST_STATUS { id, status, timestamp_field, timestamp_value }
// Sunucu başarı cevabında veri döndürmüyor (sadece {status,message}) — bu
// yüzden güncel talebi ayrıca GET_REQUESTS ile geri çekip döndürüyoruz.
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<Request> {
  const now = new Date().toISOString();
  const payload = buildUpdateStatusPayload(id, status, now);
  const response = await mepsanServerClient.send('UPDATE_REQUEST_STATUS', payload);
  if (response.status !== 'ok') throw new Error(response.message ?? 'Talep güncellenemedi');

  const updated = await fetchRequestById(id);
  if (!updated) throw new Error('Request not found');

  emitRequestStatusChanged(updated);
  return updated;
}
