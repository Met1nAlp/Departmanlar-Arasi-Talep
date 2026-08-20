// src/infrastructure/sync/outboxScheduler.ts
//
// Outbox kuyruğunun SAF (DB/network'e dokunmayan) karar mantığı. Kaynak:
// Plan Bölüm 12.4 "İşleyiş kuralları". OutboxWorker.ts bu fonksiyonları
// gerçek WatermelonDB kayıtları ve fetch çağrılarıyla birleştirir; mantığın
// kendisi burada, DB/native bağımlılığı olmadan test edilir (RealtimeClient
// ↔ backoff.ts ayrımıyla aynı desen — bkz. infrastructure/realtime/backoff.ts).

import type { OutboxEntry } from '../../contracts/types';

/** Plan §12.4 kural 2: min(2^attempts * 1000ms, 60000ms). Jitter yok — outbox
 * için plan jitter belirtmiyor (WS reconnect'in aksine, bkz. realtime/backoff.ts). */
export function computeBackoffMs(attempts: number): number {
  return Math.min(2 ** attempts * 1000, 60_000);
}

/**
 * Plan §12.4 kural 3: "Kalıcı hata (4xx, 409 hariç) → FAILED_PERMANENT".
 * 409 açıkça hariç tutulur çünkü o durum kural 4'te (çakışma çözümü) ayrı ele alınır.
 */
export function isPermanentHttpError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500 && statusCode !== 409;
}

/**
 * Plan §12.4 kural 1: "Sıra korunur — aynı targetId üzerindeki işlemler FIFO.
 * Farklı hedefler paralel gidebilir."
 *
 * targetId'si olmayan girişler (henüz sunucu id'si atanmamış CREATE_REQUEST
 * gibi) kendi clientRequestId'siyle tek başına bir grup oluşturur — başka
 * hiçbir girişle sıra çakışması olmaz, çünkü henüz var olmayan bir hedefi
 * paylaşamazlar.
 *
 * @param entries Kuyruktaki tüm girişler (herhangi bir sırada olabilir)
 * @param nowMs   `Date.now()` — test edilebilirlik için parametre
 * @returns       Şu an gönderilmeye uygun girişler: QUEUED, nextAttemptAt geçmiş,
 *                VE kendi hedef grubunda kendisinden önce bekleyen/gönderilmekte
 *                olan başka giriş yok.
 */
export function selectRunnableEntries(entries: OutboxEntry[], nowMs: number = Date.now()): OutboxEntry[] {
  const groups = new Map<string, OutboxEntry[]>();
  for (const entry of entries) {
    const key = entry.targetId ?? `__no_target__:${entry.id}`;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const runnable: OutboxEntry[] = [];
  for (const group of groups.values()) {
    // FIFO: oluşturulma sırasına göre sırala, grubun BAŞINDAKİ girişe bak.
    const sorted = [...group].sort((a, b) => a.createdAt - b.createdAt);
    const first = sorted[0];
    if (!first) continue;
    // Grup içinde SENDING varsa (hangi konumda olursa olsun) tüm grup bekler.
    if (sorted.some((e) => e.status === 'SENDING')) continue;
    if (first.status === 'QUEUED' && first.nextAttemptAt <= nowMs) {
      runnable.push(first);
    }
  }
  return runnable;
}

/** Plan §12.4 kural 6: "Kuyruk boyutu > 50 → kullanıcıya uyarı." */
export const OUTBOX_BACKLOG_WARNING_THRESHOLD = 50;

export function isQueueBacklogged(pendingCount: number): boolean {
  return pendingCount > OUTBOX_BACKLOG_WARNING_THRESHOLD;
}
