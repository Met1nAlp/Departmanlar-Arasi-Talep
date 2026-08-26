// src/domain/request/SlaPolicy.ts
//
// Öncelik → SLA süresi, %70 uyarı eşiği ve eskalasyon hesabı.
// Kaynak: MEPSAN_MTS_Proje_Plani.md Bölüm 7.5 (eskalasyon akışı) ve Bölüm 6/10.2.
//
// NOT: Priority 2 değere sadeleştirildi (ACIL/NORMAL) — eski PLANNED önceliği
// ve onun "vardiya sonu" özel SLA hesabı (dueAtForPlanned) kaldırıldı. Artık
// tüm öncelikler PRIORITY_SLA_MINUTES'teki sabit dakika değerini kullanıyor.

import type { Priority } from '../../contracts/types';
import { PRIORITY_SLA_MINUTES } from '../../contracts/types';

/** SLA'nın %70'inin dolduğu eşik — bu noktada tedarikçi ekranında kart turuncu yanıp söner. */
export const SLA_WARNING_THRESHOLD = 0.7;

export function slaDueAt(createdAt: Date, priority: Priority): Date {
  const minutes = PRIORITY_SLA_MINUTES[priority];
  return new Date(createdAt.getTime() + minutes * 60_000);
}

export function resolveSlaDueAt(createdAt: Date, priority: Priority): Date {
  return slaDueAt(createdAt, priority);
}

/** SLA'nın yüzde kaçının dolduğunu döner (0 = yeni açıldı, 1 = tam süre doldu, >1 = aşıldı). */
export function slaProgress(createdAt: Date, dueAt: Date, now: Date = new Date()): number {
  const total = dueAt.getTime() - createdAt.getTime();
  if (total <= 0) return 1;
  const elapsed = now.getTime() - createdAt.getTime();
  return elapsed / total;
}

export function isNearSla(createdAt: Date, dueAt: Date, now: Date = new Date()): boolean {
  const progress = slaProgress(createdAt, dueAt, now);
  return progress >= SLA_WARNING_THRESHOLD && progress < 1;
}

export function isSlaBreached(dueAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= dueAt.getTime();
}