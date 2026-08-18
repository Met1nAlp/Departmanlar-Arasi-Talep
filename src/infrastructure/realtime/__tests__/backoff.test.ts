// src/infrastructure/realtime/__tests__/backoff.test.ts
import { describe, expect, it } from '@jest/globals';
import { baseBackoffMs, withJitter, reconnectDelayMs, BACKOFF_SEQUENCE_MS } from '../backoff';

describe('backoff', () => {
  it('plandaki sırayı birebir uygular: 1,2,4,8,15 sn', () => {
    expect(BACKOFF_SEQUENCE_MS).toEqual([1000, 2000, 4000, 8000, 15000]);
    expect(baseBackoffMs(0)).toBe(1000);
    expect(baseBackoffMs(1)).toBe(2000);
    expect(baseBackoffMs(2)).toBe(4000);
    expect(baseBackoffMs(3)).toBe(8000);
    expect(baseBackoffMs(4)).toBe(15000);
  });

  it('4. denemeden sonra 15 sn üst sınırında sabit kalır', () => {
    expect(baseBackoffMs(5)).toBe(15000);
    expect(baseBackoffMs(100)).toBe(15000);
  });

  it('withJitter sonucu ±%20 aralığında tutar', () => {
    const base = 1000;
    // rand() = 1 -> maksimum pozitif jitter
    expect(withJitter(base, () => 1)).toBe(1200);
    // rand() = 0 -> maksimum negatif jitter
    expect(withJitter(base, () => 0)).toBe(800);
    // rand() = 0.5 -> jitter yok
    expect(withJitter(base, () => 0.5)).toBe(1000);
  });

  it('reconnectDelayMs base + jitter birleşimini doğru hesaplar', () => {
    expect(reconnectDelayMs(0, () => 1)).toBe(1200); // 1000 + %20
    expect(reconnectDelayMs(4, () => 0)).toBe(12000); // 15000 - %20
  });
});
