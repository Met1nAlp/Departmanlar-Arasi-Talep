import { describe, expect, it } from '@jest/globals';
import {
  computeBackoffMs,
  isPermanentHttpError,
  selectRunnableEntries,
  isQueueBacklogged,
  OUTBOX_BACKLOG_WARNING_THRESHOLD,
} from '../outboxScheduler';
import type { OutboxEntry } from '../../../contracts/types';

function makeEntry(overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    id: 'entry-1',
    operation: 'CREATE_REQUEST',
    targetId: null,
    payload: {},
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: 0,
    status: 'QUEUED',
    ...overrides,
  };
}

describe('computeBackoffMs', () => {
  it('Plan §12.4: min(2^attempts * 1000ms, 60000ms)', () => {
    expect(computeBackoffMs(0)).toBe(1000);
    expect(computeBackoffMs(1)).toBe(2000);
    expect(computeBackoffMs(2)).toBe(4000);
    expect(computeBackoffMs(3)).toBe(8000);
    expect(computeBackoffMs(6)).toBe(60000); // 2^6*1000=64000 -> tavan 60000
    expect(computeBackoffMs(10)).toBe(60000); // tavanda sabit kalır
  });
});

describe('isPermanentHttpError', () => {
  it('4xx kalıcı hatadır', () => {
    expect(isPermanentHttpError(400)).toBe(true);
    expect(isPermanentHttpError(404)).toBe(true);
    expect(isPermanentHttpError(422)).toBe(true);
  });

  it('409 istisnadır (çakışma çözümü ayrı ele alınır)', () => {
    expect(isPermanentHttpError(409)).toBe(false);
  });

  it('5xx ve 2xx kalıcı hata değildir', () => {
    expect(isPermanentHttpError(500)).toBe(false);
    expect(isPermanentHttpError(200)).toBe(false);
  });
});

describe('selectRunnableEntries', () => {
  it('nextAttemptAt gelecekte olan girişi seçmez', () => {
    const entries = [makeEntry({ nextAttemptAt: 5000 })];
    expect(selectRunnableEntries(entries, 1000)).toEqual([]);
  });

  it('nextAttemptAt geçmiş olan QUEUED girişi seçer', () => {
    const entries = [makeEntry({ nextAttemptAt: 500 })];
    expect(selectRunnableEntries(entries, 1000)).toEqual(entries);
  });

  it('SENDING durumundaki giriş asla runnable değildir', () => {
    const entries = [makeEntry({ status: 'SENDING', nextAttemptAt: 0 })];
    expect(selectRunnableEntries(entries, 1000)).toEqual([]);
  });

  it('aynı targetId için FIFO: yalnızca en eski giriş çalıştırılabilir', () => {
    const older = makeEntry({ id: 'a', targetId: 'req-1', createdAt: 100, nextAttemptAt: 0 });
    const newer = makeEntry({ id: 'b', targetId: 'req-1', createdAt: 200, nextAttemptAt: 0 });
    const result = selectRunnableEntries([newer, older], 1000);
    expect(result).toEqual([older]);
  });

  it('targetId aynıyken biri SENDING ise grubun tamamı bekler', () => {
    const sending = makeEntry({ id: 'a', targetId: 'req-1', createdAt: 100, status: 'SENDING' });
    const queued = makeEntry({ id: 'b', targetId: 'req-1', createdAt: 200, nextAttemptAt: 0 });
    expect(selectRunnableEntries([sending, queued], 1000)).toEqual([]);
  });

  it('farklı targetId\'ler paralel çalışabilir', () => {
    const a = makeEntry({ id: 'a', targetId: 'req-1', nextAttemptAt: 0, createdAt: 1 });
    const b = makeEntry({ id: 'b', targetId: 'req-2', nextAttemptAt: 0, createdAt: 2 });
    const result = selectRunnableEntries([a, b], 1000);
    expect(result).toEqual(expect.arrayContaining([a, b]));
    expect(result).toHaveLength(2);
  });

  it('targetId=null olan girişler birbirini bloklamaz (her biri kendi grubu)', () => {
    const a = makeEntry({ id: 'a', targetId: null, nextAttemptAt: 0 });
    const b = makeEntry({ id: 'b', targetId: null, nextAttemptAt: 0 });
    const result = selectRunnableEntries([a, b], 1000);
    expect(result).toHaveLength(2);
  });

  it('FAILED_PERMANENT girişler asla runnable değildir', () => {
    const entries = [makeEntry({ status: 'FAILED_PERMANENT', nextAttemptAt: 0 })];
    expect(selectRunnableEntries(entries, 1000)).toEqual([]);
  });
});

describe('isQueueBacklogged', () => {
  it(`eşik (${OUTBOX_BACKLOG_WARNING_THRESHOLD}) altında/eşitinde false`, () => {
    expect(isQueueBacklogged(0)).toBe(false);
    expect(isQueueBacklogged(OUTBOX_BACKLOG_WARNING_THRESHOLD)).toBe(false);
  });

  it(`eşik üzerinde true`, () => {
    expect(isQueueBacklogged(OUTBOX_BACKLOG_WARNING_THRESHOLD + 1)).toBe(true);
  });
});
