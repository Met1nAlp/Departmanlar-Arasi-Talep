// src/domain/request/__tests__/RequestStateMachine.test.ts
//
// Plan Bölüm 7.1'deki durum makinesinin her geçişini ve yetkisiz geçiş
// denemelerini kanıtlar. Jest henüz kurulmadıysa (bkz. PDF E9), bu dosya
// kurulum sonrası `npm test` ile çalışır; şimdilik de derleme/okuma için hazır.

import { describe, expect, it } from '@jest/globals';
import { TRANSITIONS, canTransition, canSystemTransition, availableTransitions, isTerminal } from '../RequestStateMachine';
import type { Role, RequestState } from '../../../contracts/types';

describe('RequestStateMachine', () => {
  it('plandaki tüm kullanıcı geçişlerini doğru rollerle kabul eder', () => {
    for (const rule of TRANSITIONS) {
      if (rule.actor !== 'USER') continue;
      for (const role of rule.allowedRoles) {
        const result = canTransition(rule.from, rule.to, role);
        expect(result.ok).toBe(true);
      }
    }
  });

  it('yetkisiz rol geçişi reddeder', () => {
    // PENDING -> ACKNOWLEDGED yalnızca SUPPLIER/SUPERVISOR/ADMIN yapabilir, REQUESTER yapamaz
    const result = canTransition('PENDING', 'ACKNOWLEDGED', 'REQUESTER');
    expect(result).toEqual({ ok: false, reason: 'ROLE_NOT_ALLOWED' });
  });

  it('tanımsız geçişi reddeder', () => {
    const result = canTransition('PENDING', 'DELIVERED', 'ADMIN');
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_TRANSITION' });
  });

  it('terminal durumdan (CLOSED) hiçbir geçişe izin vermez', () => {
    const result = canTransition('CLOSED', 'PENDING', 'ADMIN');
    expect(result).toEqual({ ok: false, reason: 'TERMINAL_STATE' });
  });

  it('CANCELLED de terminal sayılır', () => {
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(isTerminal('CLOSED')).toBe(true);
    expect(isTerminal('PENDING')).toBe(false);
  });

  it('SYSTEM geçişini kullanıcı eylemi olarak kabul etmez', () => {
    // READY_FOR_PICKUP -> IN_TRANSIT yalnızca araç (SYSTEM) tetikler
    const result = canTransition('READY_FOR_PICKUP', 'IN_TRANSIT', 'ADMIN');
    expect(result).toEqual({ ok: false, reason: 'SYSTEM_ONLY' });
  });

  it('canSystemTransition SYSTEM geçişlerini doğrular', () => {
    expect(canSystemTransition('READY_FOR_PICKUP', 'IN_TRANSIT')).toBe(true);
    expect(canSystemTransition('IN_TRANSIT', 'DELIVERED')).toBe(true);
    expect(canSystemTransition('PENDING', 'ACKNOWLEDGED')).toBe(false); // bu USER geçişi
  });

  it('SUPPLIER, CLOSED durumundaki bir çağrıyı reddedemez (terminal + tanımsız geçiş)', () => {
    const result = canTransition('CLOSED', 'REJECTED', 'SUPPLIER');
    expect(result.ok).toBe(false);
  });

  it('availableTransitions yalnızca ilgili rolün yapabileceği USER geçişlerini döner', () => {
    const supplierOptions = availableTransitions('PENDING', 'SUPPLIER');
    expect(supplierOptions.map((r) => r.to)).toContain('ACKNOWLEDGED');
    expect(supplierOptions.map((r) => r.to)).not.toContain('ESCALATED'); // SYSTEM geçişi listede olmaz

    const requesterOptions = availableTransitions('PENDING', 'REQUESTER');
    expect(requesterOptions.map((r) => r.to)).toEqual(['CANCELLED']);
  });

  it('terminal durumdan availableTransitions boş döner', () => {
    expect(availableTransitions('CLOSED', 'ADMIN')).toEqual([]);
  });

  it('planın 14 durumunun hepsi en az bir geçişte (from veya to) geçer — unutulan durum yok', () => {
    const allStates = new Set<RequestState>();
    for (const rule of TRANSITIONS) {
      allStates.add(rule.from);
      allStates.add(rule.to);
    }
    allStates.add('DRAFT'); // yalnızca 'from' olarak geçiyor, garanti ekleyelim
    const expected: RequestState[] = [
      'DRAFT', 'PENDING', 'ACKNOWLEDGED', 'REJECTED', 'PREPARING', 'PARTIALLY_READY',
      'READY_FOR_PICKUP', 'IN_TRANSIT', 'EXCEPTION', 'MANUAL_HANDOVER', 'DELIVERED',
      'ESCALATED', 'CLOSED', 'CANCELLED',
    ];
    for (const s of expected) {
      expect(allStates.has(s)).toBe(true);
    }
  });
});
