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

export async function createRequest(input: {
  departmentId: string;
  productId: string;
  quantity: number;
  requesterId: string;
  requesterName?: string;
  priority: 'ACIL' | 'NORMAL';
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

  await outboxWorker.enqueue('CREATE_REQUEST', newRequest.id, newRequest);
  await refreshPendingSyncBadge();
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);
  await recordOwnStatusChange(database, newRequest.id, newRequest.status);

  return newRequest;
}

export async function updateRequestStatus(current: Request, status: RequestStatus): Promise<Request> {
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
  await recordOwnStatusChange(database, current.id, status);

  const payload = buildUpdateStatusPayload(current.id, status, now);
  await outboxWorker.enqueue('UPDATE_REQUEST_STATUS', current.id, payload);
  await refreshPendingSyncBadge();
  await outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}

export async function cancelRequest(current: Request, reason: string): Promise<Request> {
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
  await recordOwnStatusChange(database, current.id, 'IPTAL_EDILDI');

  const payload = buildCancelRequestPayload(current.id, reason, now);
  await outboxWorker.enqueue('CANCEL_REQUEST', current.id, payload);
  await refreshPendingSyncBadge();
  void outboxWorker.processQueue().then(refreshPendingSyncBadge);

  return updated;
}

export async function rejectRequest(current: Request, reason: string): Promise<Request> {
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

  await recordOwnStatusChange(database, current.id, 'IPTAL_EDILDI');

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
  await recordOwnStatusChange(database, current.id, nextStatus);

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