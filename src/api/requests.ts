// src/api/requests.ts
import { Request, RequestStatus } from '../types';
import { mockRequests } from '../mocks/requests';
import { emitRequestStatusChanged } from './socketEvents';
import { outboxWorker, refreshPendingSyncBadge } from '../infrastructure/sync/instance';
import { mepsanServerClient, fetchRequestById } from '../infrastructure/mepsanServer/instance';
import { mapServerRequestToRequest, buildUpdateStatusPayload, buildCancelRequestPayload, buildRejectRequestPayload, buildFulfillRequestPayload } from '../infrastructure/mepsanServer/mappers';
import { database } from '../infrastructure/db';
import { recordOwnStatusChange } from '../infrastructure/notifications/knownStatusStore';

export async function getRequests(params: { userId?: string; departmentId?: string }): Promise<Request[]> {
  try {
    const response = await mepsanServerClient.send('GET_REQUESTS', {
      user_id: params.userId ?? '',
      department_id: params.departmentId ?? '',
    });
    // GEÇİCİ TEŞHİS LOGU — "refresh içerik güncellemiyor" şikayetini araştırmak için.
    // Sorun bulununca kaldırılacak.
    console.log('[GET_REQUESTS] cevap:', JSON.stringify(response).slice(0, 500));
    if (response.status !== 'ok') throw new Error(response.message ?? 'GET_REQUESTS başarısız');
    const data = Array.isArray(response.data) ? response.data : [];
    const mapped = data.map((raw) => mapServerRequestToRequest(raw as Record<string, unknown>));
    console.log('[GET_REQUESTS] map edilen kayıt sayısı:', mapped.length);
    return mapped;
  } catch (err) {
    console.warn('[GET_REQUESTS] SUNUCUDAN ALINAMADI, mock veriye düşülüyor. Hata:', err);
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

/**
 * Sepet (çoklu eşya) siparişi oluşturur. Sepetteki TÜM eşyalar (aynı
 * departmana ait olmalı — bir siparişin tek bir supplier departmanı vardır)
 * aynı yerel orderId'yi taşır (bkz. groupByOrder.ts — talep listelerinde
 * bunlar tek bir sipariş kartı altında gruplanır) — ama sunucuya HER ÜRÜN
 * İÇİN AYRI bir CREATE_REQUEST mesajı gönderilir.
 *
 * NOT (2026-09-05): Önceden tüm items'ı tek mesajda (order_id + items[])
 * göndermeyi denemiştik ama gerçek sunucu bunu desteklemiyor — sadece tekil
 * id/product_id/quantity okuyor (bkz. mappers.ts buildCreateRequestPayload
 * dosya başı notu). O formatla çoklu ürünlü siparişlerde ilk ürün eksik/adsız
 * görünüyor, diğerleri hiç oluşmuyordu. Barış'ın backend'i items[] formatını
 * destekleyecek şekilde güncellenene kadar TEKİL mesaj formatına dönüldü.
 */
export async function createOrder(input: {
  departmentId: string;
  items: { productId: string; quantity: number }[];
  requesterId: string;
  requesterName?: string;
  priority: 'ACIL' | 'NORMAL';
}): Promise<Request[]> {
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  const newRequests: Request[] = input.items.map((item, index) => ({
    id: `r-${Date.now()}-${index}`,
    orderId,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    departmentId: input.departmentId,
    productId: item.productId,
    quantity: item.quantity,
    priority: input.priority,
    status: 'TALEP_ALINDI',
    deliveryMethod: 'elektrikli_transpalet',
    createdAt,
  }));

  console.log('[REQUEST] yeni sipariş oluşturuluyor:', orderId, '·', newRequests.length, 'kalem ·', input.departmentId);

  newRequests.forEach((request) => {
    mockRequests.push(request); // optimistic update — sunucu onayı beklenmez
    emitRequestStatusChanged(request);
  });

  await Promise.all(
    newRequests.map((request) => outboxWorker.enqueue('CREATE_REQUEST', request.id, request))
  );
  await refreshPendingSyncBadge();
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);
  await Promise.all(newRequests.map((request) => recordOwnStatusChange(database, request)));

  return newRequests;
}

export async function updateRequestStatus(current: Request, status: RequestStatus): Promise<Request> {
  console.log('[REQUEST] durum güncelleniyor:', current.id, current.status, '→', status);
  const now = new Date().toISOString();

  const updated: Request = {
    ...current,
    status,
    preparedAt: status === 'HAZIRLANIYOR' ? now : current.preparedAt,
    readyAt: status === 'HAZIR' ? now : current.readyAt,
    onTheWayAt: status === 'YOLDA' ? now : current.onTheWayAt,
    deliveredAt: status === 'TESLIM_EDILDI' ? now : current.deliveredAt,
  };

  const idx = mockRequests.findIndex((r) => r.id === current.id);
  if (idx !== -1) mockRequests[idx] = updated;
  else mockRequests.push(updated);

  emitRequestStatusChanged(updated);
  await recordOwnStatusChange(database, updated);

  const payload = buildUpdateStatusPayload(current.id, status, now);
  await outboxWorker.enqueue('UPDATE_REQUEST_STATUS', current.id, payload);
  await refreshPendingSyncBadge();
  await outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}

export async function cancelRequest(current: Request, reason: string): Promise<Request> {
  console.log('[REQUEST] iptal ediliyor:', current.id, '·', reason);
  const now = new Date().toISOString();

  const updated: Request = {
    ...current,
    status: 'IPTAL_EDILDI',
    cancelledAt: now,
    cancelReason: reason,
  };

  const idx = mockRequests.findIndex((r) => r.id === current.id);
  if (idx !== -1) mockRequests[idx] = updated;
  else mockRequests.push(updated);

  emitRequestStatusChanged(updated);
  await recordOwnStatusChange(database, updated);

  const payload = buildCancelRequestPayload(current.id, reason, now);
  await outboxWorker.enqueue('CANCEL_REQUEST', current.id, payload);
  await refreshPendingSyncBadge();
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}

export async function rejectRequest(current: Request, reason: string): Promise<Request> {
  console.log('[REQUEST] reddediliyor:', current.id, '·', reason);
  const now = new Date().toISOString();

  const updated: Request = {
    ...current,
    status: 'REDDEDILDI',
    rejectedAt: now,
    rejectReason: reason,
  };

  const idx = mockRequests.findIndex((r) => r.id === current.id);
  if (idx !== -1) mockRequests[idx] = updated;
  else mockRequests.push(updated);

  emitRequestStatusChanged(updated);

  // NOT: sunucu CANCEL_REQUEST ve REJECT_REQUEST'i AYNI IPTAL_EDILDI durumuna
  // düşürüyor (yerelde ayrı REDDEDILDI göstersek de) — known map'e sunucunun
  // geri yankılayacağı değeri (IPTAL_EDILDI) yazmazsak, echo geldiğinde
  // "farklı durum" sanılıp gereksiz bildirim tetiklenir.
  await recordOwnStatusChange(database, { ...updated, status: 'IPTAL_EDILDI' });

  const payload = buildRejectRequestPayload(current.id, reason, now);
  await outboxWorker.enqueue('REJECT_REQUEST', current.id, payload);
  await refreshPendingSyncBadge();
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}


// Backend sözleşmesi: FULFILL_REQUEST { id, fulfilled_quantity, status,
// timestamp_field, timestamp_value } — kısmi karşılama için. Aynı optimistic
// update + outbox deseni, ama status'un yanında fulfilledQuantity da taşınır.
export async function fulfillRequest(
  current: Request,
  nextStatus: RequestStatus,
  fulfilledQuantity: number
): Promise<Request> {
  const now = new Date().toISOString();
  console.log('[FULFILL] çağrıldı:', current.id, 'nextStatus:', nextStatus, 'qty:', fulfilledQuantity);
  const updated: Request = {
    ...current,
    status: nextStatus,
    fulfilledQuantity,
    preparedAt: nextStatus === 'HAZIRLANIYOR' ? now : current.preparedAt,
    readyAt: nextStatus === 'HAZIR' ? now : current.readyAt,
    onTheWayAt: nextStatus === 'YOLDA' ? now : current.onTheWayAt,
    deliveredAt: nextStatus === 'TESLIM_EDILDI' ? now : current.deliveredAt,
  };

  const idx = mockRequests.findIndex((r) => r.id === current.id);
  if (idx !== -1) mockRequests[idx] = updated;
  else mockRequests.push(updated);

  emitRequestStatusChanged(updated);
  await recordOwnStatusChange(database, updated);

  const payload = buildFulfillRequestPayload(current.id, nextStatus, fulfilledQuantity, now);
  await outboxWorker.enqueue('FULFILL_REQUEST', current.id, payload);
  await refreshPendingSyncBadge();
  // Diğer offline-first işlemlerin aksine BURADA bekliyoruz (void değil) —
  // çağıran ekran genelde işlemden hemen sonra geri navigasyon yapıp listeyi
  // yeniliyor; sunucu cevabını beklemeden dönersek liste eski veriyi görüyordu
  // (race condition, doğrulandı). Bağlantı yoksa processQueue zaten hemen
  // döner (network hatası alır), bu await pratikte gecikme yaratmaz.
  await outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}