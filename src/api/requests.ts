// src/api/requests.ts
import { Request, RequestStatus } from '../types';
import { sendCreateRequest, sendGetRequests, sendUpdateRequestStatus } from '../infrastructure/realtime/MepsanService';
import { emitRequestStatusChanged } from './socketEvents';

// Backend sözleşmesi: GET /requests?userId=&role=
export async function getRequests(params: { userId?: string; departmentId?: string }): Promise<Request[]> {
  try {
    const response = await sendGetRequests(params.userId, params.departmentId);
    if (response.status === 'ok') {
      // Backend'den gelen snake_case JSON'u, frontend camelCase modeline çevir
      return (response.data as any[]).map((r: any) => ({
        id: r.id,
        requesterId: r.requesterId,
        departmentId: r.departmentId,
        productId: r.productId,
        quantity: r.quantity,
        status: r.status as RequestStatus,
        deliveryMethod: 'elektrikli_transpalet', // Sabit varsayıldı
        createdAt: r.createdAt,
        preparedAt: r.preparedAt,
        readyAt: r.readyAt,
        onTheWayAt: r.onTheWayAt,
        deliveredAt: r.deliveredAt
      }));
    }
    return [];
  } catch (error) {
    console.error("Talepler getirilirken hata:", error);
    return [];
  }
}

// Backend sözleşmesi: GET /requests/:id (Liste çekip buluyoruz şimdilik)
export async function getRequestById(id: string): Promise<Request | undefined> {
  const allReqs = await getRequests({});
  return allReqs.find((r) => r.id === id);
}

// Backend sözleşmesi: POST /requests  body: { departmentId, productId, quantity, requesterId, priority }
export async function createRequest(input: {
  departmentId: string;
  productId: string;
  quantity: number;
  requesterId: string;
  priority?: string;
}): Promise<Request> {
  const newRequest = {
    id: `r-${Date.now()}`,
    requester_id: input.requesterId,
    department_id: input.departmentId,
    product_id: input.productId,
    quantity: input.quantity,
    status: 'TALEP_ALINDI',
    priority: input.priority ?? 'NORMAL',
    created_at: new Date().toISOString(),
  };

  const response = await sendCreateRequest(newRequest);
  if (response.status !== 'ok') {
    throw new Error(response.message || 'Talep oluşturulamadı');
  }

  // Frontend modeline çevirerek dön
  return {
    id: newRequest.id,
    requesterId: newRequest.requester_id,
    departmentId: newRequest.department_id,
    productId: newRequest.product_id,
    quantity: newRequest.quantity,
    status: newRequest.status as RequestStatus,
    priority: (newRequest.priority ?? 'NORMAL') as any,
    deliveryMethod: 'elektrikli_transpalet',
    createdAt: newRequest.created_at,
  };
}

// Backend sözleşmesi: PATCH /requests/:id/status  body: { status }
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<Request> {
  let timestampField = '';
  let timestampValue = new Date().toISOString();

  if (status === 'HAZIRLANIYOR') timestampField = 'prepared_at';
  else if (status === 'HAZIR') timestampField = 'ready_at';
  else if (status === 'YOLDA') timestampField = 'on_the_way_at';
  else if (status === 'TESLIM_EDILDI') timestampField = 'delivered_at';

  const response = await sendUpdateRequestStatus(id, status, timestampField, timestampValue);
  if (response.status !== 'ok') {
    throw new Error(response.message || 'Durum güncellenemedi');
  }

  // Durum değişikliğini uygulamanın diğer kısımlarına bildir
  // (Normalde RealtimeClient üzerinden event gelir ama UI'ı anında güncellemek için)
  const req = await getRequestById(id);
  if (req) {
    emitRequestStatusChanged(req);
    return req;
  }
  throw new Error('Talep bulunamadı');
}