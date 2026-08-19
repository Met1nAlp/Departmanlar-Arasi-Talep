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

/** GET_REQUESTS cevabındaki tek bir öğeyi (zaten camelCase) Request tipine uydurur. */
export function mapServerRequestToRequest(raw: Record<string, unknown>): Request {
  return {
    id: String(raw.id ?? ''),
    requesterId: String(raw.requesterId ?? ''),
    departmentId: String(raw.departmentId ?? ''),
    productId: String(raw.productId ?? ''),
    quantity: Number(raw.quantity ?? 0),
    status: (String(raw.status ?? 'TALEP_ALINDI') as RequestStatus),
    deliveryMethod: DEFAULT_DELIVERY_METHOD,
    createdAt: String(raw.createdAt ?? ''),
    preparedAt: cleanTimestamp(raw.preparedAt),
    readyAt: cleanTimestamp(raw.readyAt),
    onTheWayAt: cleanTimestamp(raw.onTheWayAt),
    deliveredAt: cleanTimestamp(raw.deliveredAt),
  };
}

/** CREATE_REQUEST komutunun beklediği snake_case gövde. */
export function buildCreateRequestPayload(request: Request): Record<string, unknown> {
  return {
    id: request.id,
    requester_id: request.requesterId,
    department_id: request.departmentId,
    product_id: request.productId,
    quantity: request.quantity,
    status: request.status,
    created_at: request.createdAt,
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
