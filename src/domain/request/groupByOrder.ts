// src/domain/request/groupByOrder.ts
//
// Sepetten (bkz. api/requests.ts createOrder) gelen çoklu-eşya siparişlerinde
// her eşya kendi Request kaydını taşımaya devam ediyor ama hepsi aynı
// orderId'yi paylaşıyor. Listeleme ekranlarında (Home, IncomingRequests) bu
// kayıtlar TEK bir "sipariş" olarak, ayrı ayrı kartlar halinde DEĞİL,
// gruplanmış gösterilmeli — bu dosya o gruplamayı tek yerden yapar.
//
// orderId'si olmayan (eski/tekil) talepler kendi id'leriyle tekil grup olur,
// böylece mevcut davranış (bir kart = bir talep) korunmuş olur.

import type { Request } from '../../types';

export interface RequestOrderGroup {
  /** orderId varsa o, yoksa talebin kendi id'si — React key'i için de kullanılır. */
  key: string;
  orderId?: string;
  requests: Request[];
}

/** Listedeki mevcut sırayı korur — sadece aynı orderId'ye sahip kayıtları yan yana toplar. */
export function groupRequestsByOrder(requests: Request[]): RequestOrderGroup[] {
  const groups: RequestOrderGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const request of requests) {
    const key = request.orderId ?? request.id;
    const existingIndex = indexByKey.get(key);
    if (existingIndex !== undefined) {
      groups[existingIndex].requests.push(request);
      continue;
    }
    indexByKey.set(key, groups.length);
    groups.push({ key, orderId: request.orderId, requests: [request] });
  }

  return groups;
}
