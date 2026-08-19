// src/api/requests.ts
import { Request, RequestStatus } from '../types';
import { mockRequests } from '../mocks/requests';
import { delay } from './delay';
import { emitRequestStatusChanged } from './socketEvents';
import { outboxWorker, refreshPendingSyncBadge } from '../infrastructure/sync/instance';

// Backend sözleşmesi: GET /requests?userId=&role=
export async function getRequests(params: { userId?: string; departmentId?: string }): Promise<Request[]> {
  await delay();
  // Mock filtreleme mantığı — backend bunu SQL/Firestore sorgusuyla yapacak
  return mockRequests.filter((r) =>
    params.userId ? r.requesterId === params.userId : params.departmentId ? r.departmentId === params.departmentId : true
  );
}

// Backend sözleşmesi: GET /requests/:id
export async function getRequestById(id: string): Promise<Request | undefined> {
  await delay();
  return mockRequests.find((r) => r.id === id);
}

// Backend sözleşmesi: POST /requests  body: { departmentId, productId, quantity, requesterId }
//
// Plan Bölüm 7.4 (offline senaryosu): "Kullanıcı eylemi → Local'e yaz → UI
// anında güncellenir (optimistic update) → Outbox worker gönderir." Bu
// fonksiyon artık o akışı uyguluyor — çağrı önce yerel olarak (mockRequests)
// oluşturulur ve ekrana hemen yansır, gerçek gönderim OutboxWorker üzerinden
// arka planda yapılır (bkz. infrastructure/sync/instance.ts).
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

  await outboxWorker.enqueue('CREATE_REQUEST', null, { ...input, localId: newRequest.id });
  await refreshPendingSyncBadge();
  // Kuyruğu hemen işlemeyi dene (arka planda) — bağlantı yoksa OutboxWorker
  // kendi backoff mantığıyla (Plan §12.4) daha sonra tekrar dener.
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return newRequest;
}

// Backend sözleşmesi: PATCH /requests/:id/status  body: { status }
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<Request> {
  await delay();
  const req = mockRequests.find((r) => r.id === id);
  if (!req) throw new Error('Request not found');

  req.status = status;
  // Zaman damgalarını da burada set edelim — Yönetici panelindeki süre raporları için gerekliydi
  const now = new Date().toISOString();
  if (status === 'HAZIRLANIYOR') req.preparedAt = now;
  if (status === 'HAZIR') req.readyAt = now;
  if (status === 'YOLDA') req.onTheWayAt = now;
  if (status === 'TESLIM_EDILDI') req.deliveredAt = now;

  emitRequestStatusChanged(req); // ← YENİ: dinleyen tüm ekranlara haber ver
  return req;
}