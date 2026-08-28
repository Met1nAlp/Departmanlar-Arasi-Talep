// src/domain/request/predicates.ts
// Bu üç fonksiyon şu an dört ekranda kopyalanmış halde duruyor ve
// RequestTrackingScreen'deki kopya hatalı: `> 0` kontrolü düşmüş olduğu için
// fulfilledQuantity 0 olan talepte kullanıcı "0 / 5 adet karşılandı" görüyor.
import { Request, RequestStatus } from '../../types';

export const isTerminal = (r: Request): boolean =>
  r.status === 'IPTAL_EDILDI' || r.status === 'REDDEDILDI';

export const isPartial = (r: Request): boolean =>
  r.fulfilledQuantity !== undefined &&
  r.fulfilledQuantity > 0 &&
  r.fulfilledQuantity < r.quantity &&
  (r.status === 'HAZIRLANIYOR' || r.status === 'HAZIR');

export const isOpen = (r: Request): boolean => !isTerminal(r) && r.status !== 'TESLIM_EDILDI';

const STATUS_WEIGHT: Partial<Record<RequestStatus, number>> = {
  HAZIR: 0,
  HAZIRLANIYOR: 20,
  TALEP_ALINDI: 30,
  YOLDA: 15,
};

/** Liste sırası: "en yeni" değil, "eyleme geçebileceğim". */
export function actionWeight(r: Request): number {
  if (r.priority === 'ACIL' && isOpen(r)) return -10;
  if (r.status === 'HAZIR') return 0;
  if (isPartial(r)) return 10;
  return STATUS_WEIGHT[r.status] ?? 40;
}

export function byActionThenRecency(a: Request, b: Request): number {
  const diff = actionWeight(a) - actionWeight(b);
  if (diff !== 0) return diff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
