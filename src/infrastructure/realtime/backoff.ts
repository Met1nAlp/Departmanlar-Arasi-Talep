// src/infrastructure/realtime/backoff.ts
//
// Yeniden bağlanma gecikmesi hesaplaması. Kaynak: MEPSAN_MTS_Proje_Plani.md
// Bölüm 9.2 "Kritik detaylar": "Backoff üst sınırı 15 sn: 30 tablet aynı anda
// yeniden bağlanırsa sunucuyu boğmamak için jitter (±%20 rastgelelik) eklenir."
// Sıra: 1s → 2s → 4s → 8s → 15s (max), plandaki sequence diagramıyla birebir.
//
// Saf fonksiyonlar — test edilebilirlik için RealtimeClient'tan ayrı tutulur.

export const BACKOFF_SEQUENCE_MS: readonly number[] = [1000, 2000, 4000, 8000, 15000];

export const JITTER_FACTOR = 0.2; // ±%20

/** attempt 0-tabanlı: 0 -> 1000ms, 1 -> 2000ms, ... 4+ -> 15000ms (üst sınırda sabitlenir). */
export function baseBackoffMs(attempt: number): number {
  const index = Math.min(attempt, BACKOFF_SEQUENCE_MS.length - 1);
  return BACKOFF_SEQUENCE_MS[index];
}

/**
 * ±%20 jitter uygular. `rand` test edilebilirlik için enjekte edilebilir
 * (varsayılan Math.random). Sonuç her zaman [base*(1-JITTER), base*(1+JITTER)] aralığında.
 */
export function withJitter(baseMs: number, rand: () => number = Math.random): number {
  const jitterRange = baseMs * JITTER_FACTOR;
  const offset = (rand() * 2 - 1) * jitterRange; // [-jitterRange, +jitterRange]
  return Math.round(baseMs + offset);
}

export function reconnectDelayMs(attempt: number, rand: () => number = Math.random): number {
  return withJitter(baseBackoffMs(attempt), rand);
}
