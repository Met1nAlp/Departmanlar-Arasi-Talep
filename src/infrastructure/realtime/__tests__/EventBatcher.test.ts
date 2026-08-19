// src/infrastructure/realtime/__tests__/EventBatcher.test.ts
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { EventBatcher } from '../EventBatcher';

describe('EventBatcher', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('100 ms penceresinde birikeni tek seferde flush eder', () => {
    const flushed: number[][] = [];
    const batcher = new EventBatcher<number>(100, (batch) => flushed.push(batch));

    batcher.push(1);
    batcher.push(2);
    batcher.push(3);

    expect(flushed.length).toBe(0); // henüz flush olmadı
    jest.advanceTimersByTime(100);
    expect(flushed).toEqual([[1, 2, 3]]);
  });

  it('flush sonrası yeni push yeni bir pencere başlatır', () => {
    const flushed: number[][] = [];
    const batcher = new EventBatcher<number>(100, (batch) => flushed.push(batch));

    batcher.push(1);
    jest.advanceTimersByTime(100);
    batcher.push(2);
    jest.advanceTimersByTime(100);

    expect(flushed).toEqual([[1], [2]]);
  });

  it('boşken flush hiçbir şey yapmaz', () => {
    const flushed: number[][] = [];
    const batcher = new EventBatcher<number>(100, (batch) => flushed.push(batch));
    batcher.flush();
    expect(flushed).toEqual([]);
  });

  it('dispose bekleyen flush\'ı iptal eder', () => {
    const flushed: number[][] = [];
    const batcher = new EventBatcher<number>(100, (batch) => flushed.push(batch));
    batcher.push(1);
    batcher.dispose();
    jest.advanceTimersByTime(200);
    expect(flushed).toEqual([]);
  });
});
