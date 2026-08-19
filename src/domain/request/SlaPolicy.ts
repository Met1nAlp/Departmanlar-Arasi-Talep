// src/domain/request/SlaPolicy.ts
//
// Öncelik → SLA süresi, %70 uyarı eşiği ve eskalasyon hesabı.
// Kaynak: MEPSAN_MTS_Proje_Plani.md Bölüm 7.5 (eskalasyon akışı) ve Bölüm 6/10.2.
//
// PLANNED önceliği "vardiya sonu" ile ölçülür, sabit dakika değil — bu yüzden
// SLA hesaplarının çoğu Exclude<Priority, 'PLANNED'> ile çalışır ve PLANNED
// ayrı ele alınır (bkz. dueAtForPlanned).

import type { Priority } from '../../contracts/types';
import { PRIORITY_SLA_MINUTES } from '../../contracts/types';

/** SLA'nın %70'inin dolduğu eşik — bu noktada tedarikçi ekranında kart turuncu yanıp söner. */
export const SLA_WARNING_THRESHOLD = 0.7;

export function slaDueAt(createdAt: Date, priority: Exclude<Priority, 'PLANNED'>): Date {
  const minutes = PRIORITY_SLA_MINUTES[priority];
  return new Date(createdAt.getTime() + minutes * 60_000);
}

/**
 * PLANNED önceliği için "vardiya sonu" hedefi. Vardiya sınırları backend/config'den
 * gelmelidir; burada basit bir varsayım kullanılır (08:00 / 16:00 / 00:00 üç vardiya).
 * Gerçek vardiya takvimi netleşince (Plan Bölüm 25 açık soruları) bu fonksiyon güncellenir.
 */
export function dueAtForPlanned(createdAt: Date, shiftEndHours: readonly number[] = [8, 16, 24]): Date {
  const hour = createdAt.getHours();
  const endHour = shiftEndHours.find((h) => hour < h) ?? shiftEndHours[shiftEndHours.length - 1];
  const due = new Date(createdAt);
  due.setHours(endHour % 24, 0, 0, 0);
  if (endHour === 24) due.setDate(due.getDate() + (hour >= 0 ? 1 : 0));
  return due;
}

export function resolveSlaDueAt(createdAt: Date, priority: Priority): Date {
  return priority === 'PLANNED' ? dueAtForPlanned(createdAt) : slaDueAt(createdAt, priority);
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
