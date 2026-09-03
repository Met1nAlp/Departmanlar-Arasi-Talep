// src/infrastructure/mepsanServer/mappers.ts
//
// ÖNEMLİ (databasemanager.cpp'den doğrulandı): eşleme TEK YÖNLÜ asimetrik.
//   - İstemciden sunucuya giden komut alanları (CREATE_REQUEST,
//     UPDATE_REQUEST_STATUS) snake_case OLMAK ZORUNDA — serverhandler.cpp
//     bu isimlerle jsonObj["..."] okuyor.
//   - Sunucudan gelen GET_REQUESTS cevabındaki `data` dizisi ZATEN camelCase
//     (databasemanager.cpp:174-189, req["requesterId"] = ... şeklinde
//     dolduruluyor) — snake_case DEĞİL. Bu yüzden gelen tarafta gerçek bir
//     "çeviri" değil, sadece tipe uydurma (boş string -> undefined,
//     deliveryMethod'u elle ekleme) yapılıyor.

import { Request, RequestStatus } from '../../types';

// requests tablosunda deliveryMethod diye bir sütun yok — bu alan sunucuda
// hiç izlenmiyor, tüm mock veride de zaten sabit tek değerdi.
const DEFAULT_DELIVERY_METHOD = 'elektrikli_transpalet' as const;

/** Boş string (SQLite NULL'ın JSON karşılığı) -> undefined. */
function cleanTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value;
}

export function mapServerRequestToRequest(raw: Record<string, unknown>): Request {
  const rawPriority = String(raw.priority ?? '').toUpperCase();
  const priority: 'ACIL' | 'NORMAL' =
    rawPriority.includes('ACIL') || rawPriority.includes('YUKSEK') || rawPriority.includes('URGENT')
      ? 'ACIL'
      : 'NORMAL';
  return {
    id: String(raw.id ?? ''),
    requesterId: String(raw.requesterId ?? ''),
    // GET_REQUESTS camelCase döndürüyor (requesterName) ama Barış'ın
    // requester_name alanını CARD_LOGIN/CREATE_REQUEST cevabına eklediği
    // güncellemeyle bazı yollarda snake_case gelme ihtimaline karşı ikisini
    // de kontrol ediyoruz — hangisi doluysa o kullanılır.
    requesterName: cleanTimestamp(raw.requesterName) ?? cleanTimestamp(raw.requester_name),
    // Sunucu order_id'yi henüz GET_REQUESTS'e eklemedi (doğrulanmadı) — ama
    // eklerse (camelCase orderId ya da snake_case order_id) sepet gruplaması
    // sunucudan gelen taze veride de otomatik çalışsın diye burada da okunuyor.
    orderId: cleanTimestamp(raw.orderId) ?? cleanTimestamp(raw.order_id),
    departmentId: String(raw.departmentId ?? ''),
    productId: String(raw.productId ?? ''),
    quantity: Number(raw.quantity ?? 0),
    fulfilledQuantity: typeof raw.fulfilledQuantity === 'number' ? raw.fulfilledQuantity : undefined,
    priority,
    status: (String(raw.status ?? 'TALEP_ALINDI') as RequestStatus),
    deliveryMethod: DEFAULT_DELIVERY_METHOD,
    createdAt: String(raw.createdAt ?? ''),
    preparedAt: cleanTimestamp(raw.preparedAt),
    readyAt: cleanTimestamp(raw.readyAt),
    onTheWayAt: cleanTimestamp(raw.onTheWayAt),
    deliveredAt: cleanTimestamp(raw.deliveredAt),
    cancelledAt: cleanTimestamp(raw.cancelledAt),
    cancelReason: cleanTimestamp(raw.cancelReason),
    rejectedAt: cleanTimestamp(raw.rejectedAt),
    rejectReason: cleanTimestamp(raw.rejectReason),
  };
}

// ---------------------------------------------------------------------------
// CREATE_REQUEST — Sepet (çoklu eşya) modeli. Eskiden her eşya kendi
// CREATE_REQUEST'iyle (tekil product_id/quantity) gönderiliyordu; artık aynı
// sipariş içindeki TÜM eşyalar tek bir order_id altında `items` dizisiyle TEK
// mesajda gidiyor (Barış'ın dokümanı, 2026-09-01). Dikkat: items elemanlarının
// kendi id'si YOK — sunucu bunları order_id'ye bağlı olarak kendi üretiyor.
// ---------------------------------------------------------------------------

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  orderId: string;
  requesterId: string;
  departmentId: string;
  status: RequestStatus;
  createdAt: string;
  items: CreateOrderItem[];
}

export function buildCreateOrderPayload(order: CreateOrderPayload): Record<string, unknown> {
  return {
    order_id: order.orderId,
    requester_id: order.requesterId,
    department_id: order.departmentId,
    status: order.status,
    created_at: order.createdAt,
    items: order.items.map((item) => ({ product_id: item.productId, qty: item.quantity })),
  };
}

/**
 * Her RequestStatus'un hangi sütuna zaman damgası yazacağını belirler
 * (serverhandler.cpp: `sql += ", " + timestampField + " = :tsValue"` — bu
 * isim DOĞRUDAN SQL sütun adı olarak kullanılıyor, snake_case olmak zorunda).
 * requests.ts'teki mevcut mock mantıkla birebir aynı eşleme (Plan tutarlılığı).
 */
const STATUS_TIMESTAMP_COLUMN: Partial<Record<RequestStatus, string>> = {
  HAZIRLANIYOR: 'prepared_at',
  HAZIR: 'ready_at',
  YOLDA: 'on_the_way_at',
  TESLIM_EDILDI: 'delivered_at',
};

/** UPDATE_REQUEST_STATUS komutunun beklediği snake_case gövde. */
export function buildUpdateStatusPayload(
  id: string,
  status: RequestStatus,
  timestampValue: string
): Record<string, unknown> {
  const timestampField = STATUS_TIMESTAMP_COLUMN[status];
  return {
    id,
    status,
    timestamp_field: timestampField ?? '',
    timestamp_value: timestampField ? timestampValue : '',
  };
}

// ---------------------------------------------------------------------------
// CARD_LOGIN — GERÇEK format doğrulandı (2026-08-21):
// { status: "ok"|"error", message: string, user: { found, id, name, department, role } }
// ---------------------------------------------------------------------------

import type { User, UserRole } from '../../types';

export interface CardLoginRawUser {
  found: boolean;
  id: number;
  name: string;
  department: string; // DİKKAT: departman ADI geliyor, id değil
  role: string;
}

export interface CardLoginRawResponse {
  status: 'ok' | 'error';
  message: string;
  user?: CardLoginRawUser;
}

export type CardLoginResult =
  | { outcome: 'success'; user: User }
  | { outcome: 'not_found'; message: string }
  | { outcome: 'error'; message: string };

export function parseCardLoginResponse(raw: CardLoginRawResponse, cardUid: string): CardLoginResult {
  if (raw.status === 'error') {
    return { outcome: 'error', message: raw.message };
  }
  if (!raw.user || !raw.user.found) {
    return { outcome: 'not_found', message: raw.message || 'Kart tanımlı değil.' };
  }
  return { outcome: 'success', user: mapCardLoginResponseToUser(raw.user, cardUid) };
}

function mapCardLoginResponseToUser(raw: CardLoginRawUser, cardUid: string): User {
  return {
    id: String(raw.id),
    name: raw.name,
    role: raw.role as UserRole,
    departmentId: raw.role === 'departman_yetkilisi' ? raw.department ?? undefined : undefined,
    cardUid,
  };
}

/** CANCEL_REQUEST komutunun beklediği snake_case gövde. */
export function buildCancelRequestPayload(
  id: string,
  reason: string,
  cancelledAt: string
): Record<string, unknown> {
  return {
    id,
    cancel_reason: reason,
    cancelled_at: cancelledAt,
  };
}

/** REJECT_REQUEST komutunun beklediği gövde — Barış'ın dokümanına göre
 * CANCEL_REQUEST ile birebir aynı desende çalışıyor. */
export function buildRejectRequestPayload(
  id: string,
  reason: string,
  rejectedAt: string
): Record<string, unknown> {
  return {
    id,
    reject_reason: reason,
    rejected_at: rejectedAt,
  };
}


/**
 * FULFILL_REQUEST komutunun gövdesi. Barış'ın dokümanındaki örnek sadece
 * HAZIR adımı için "ready_at" gösteriyordu — biz UPDATE_REQUEST_STATUS'teki
 * genel timestamp_field/timestamp_value desenini kullanıyoruz ki
 * "Hazırlamaya Başla" adımında da (HAZIRLANIYOR) çalışsın. Test sonucuna
 * göre bu varsayım doğrulanmalı — sunucu reddederse Barış'ın orijinal
 * "ready_at" düz alan formatına döneceğiz.
 */
export function buildFulfillRequestPayload(
  id: string,
  status: RequestStatus,
  fulfilledQuantity: number,
  timestampValue: string
): Record<string, unknown> {
  const timestampField = STATUS_TIMESTAMP_COLUMN[status];
  return {
    id,
    fulfilled_quantity: fulfilledQuantity,
    status,
    timestamp_field: timestampField ?? '',
    timestamp_value: timestampField ? timestampValue : '',
  };
}

// ---------------------------------------------------------------------------
// GET_PARTS — departman bazlı ürün listesi ve QR ile tekil ürün sorgusu.
// Alan adı diğer komutlarla tutarlı: "department" (department_id değil).
// ---------------------------------------------------------------------------

import type { Product } from '../../types';

export function mapServerPartToProduct(raw: Record<string, unknown>): Product {
  return {
    // GERÇEK cevapta ayrı bir "id" alanı yok — qrCode benzersiz olduğu için
    // onu id olarak kullanıyoruz (GET_REQUESTS'teki gibi camelCase geliyor).
    id: String(raw.qrCode ?? ''),
    name: String(raw.name ?? '').trim(),
    qrCode: String(raw.qrCode ?? ''),
    departmentId: String(raw.department ?? ''),
  };
}