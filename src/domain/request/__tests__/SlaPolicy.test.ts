// src/domain/request/__tests__/SlaPolicy.test.ts
import { describe, expect, it } from '@jest/globals';
import { slaDueAt, slaProgress, isNearSla, isSlaBreached, SLA_WARNING_THRESHOLD } from '../SlaPolicy';

describe('SlaPolicy', () => {
  it('LINE_DOWN için 5 dakikalık SLA hesaplar', () => {
    const created = new Date('2026-08-12T10:00:00Z');
    const due = slaDueAt(created, 'LINE_DOWN');
    expect(due.toISOString()).toBe('2026-08-12T10:05:00.000Z');
  });

  it('URGENT için 15, NORMAL için 60 dakika', () => {
    const created = new Date('2026-08-12T10:00:00Z');
    expect(slaDueAt(created, 'URGENT').getTime() - created.getTime()).toBe(15 * 60_000);
    expect(slaDueAt(created, 'NORMAL').getTime() - created.getTime()).toBe(60 * 60_000);
  });

  it('slaProgress 0 ile 1 arasında doğru oranı verir', () => {
    const created = new Date('2026-08-12T10:00:00Z');
    const due = new Date('2026-08-12T10:10:00Z');
    const now = new Date('2026-08-12T10:07:00Z'); // %70
    expect(slaProgress(created, due, now)).toBeCloseTo(0.7, 5);
  });

  it('%70 eşiğinde isNearSla true döner, altında false', () => {
    const created = new Date('2026-08-12T10:00:00Z');
    const due = new Date('2026-08-12T10:10:00Z');
    expect(isNearSla(created, due, new Date('2026-08-12T10:07:00Z'))).toBe(true);
    expect(isNearSla(created, due, new Date('2026-08-12T10:05:00Z'))).toBe(false);
    expect(SLA_WARNING_THRESHOLD).toBe(0.7);
  });

  it('süre dolunca isSlaBreached true döner', () => {
    const due = new Date('2026-08-12T10:10:00Z');
    expect(isSlaBreached(due, new Date('2026-08-12T10:09:00Z'))).toBe(false);
    expect(isSlaBreached(due, new Date('2026-08-12T10:10:00Z'))).toBe(true);
    expect(isSlaBreached(due, new Date('2026-08-12T10:15:00Z'))).toBe(true);
  });
});
