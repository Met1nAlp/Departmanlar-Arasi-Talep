// src/utils/fakePriority.ts
//
// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok. Talebin id'sine
// göre SABİT (aynı talep hep aynı rengi alır) ama SAHTE bir öncelik üretir.
// HomeScreen ve IncomingRequestsScreen aynı mantığı paylaşıyor, tek yerde tutulur.
import type { Priority } from '../design-system/components/PriorityBadge';

export function getTempFakePriority(requestId: string): Priority {
  const priorities: Priority[] = ['ACIL', 'NORMAL'];
  let hash = 0;
  for (let i = 0; i < requestId.length; i++) hash += requestId.charCodeAt(i);
  return priorities[hash % priorities.length];
}