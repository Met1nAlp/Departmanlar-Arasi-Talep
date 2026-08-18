// src/domain/request/__tests__/RequestPolicies.test.ts
import { describe, expect, it } from '@jest/globals';
import {
  canCreate,
  canCancel,
  canChangePriority,
  canClose,
  canManageStaff,
  visibleRequestScope,
} from '../RequestPolicies';
import type { MaterialRequest } from '../../../contracts/types';

function makeRequest(overrides: Partial<MaterialRequest> = {}): MaterialRequest {
  return {
    id: 'r1',
    requestNo: 'MR-2026-000001',
    requesterUserId: 'u-requester',
    requesterDeptId: 'MONTAJ-1',
    supplierDeptId: 'DEPO-A',
    state: 'PENDING',
    priority: 'NORMAL',
    lines: [],
    createdAt: new Date().toISOString(),
    clientRequestId: 'c-1',
    ...overrides,
  };
}

describe('RequestPolicies', () => {
  it('PLANNER çağrı oluşturamaz, diğer roller oluşturabilir', () => {
    expect(canCreate({ actorUserId: 'x', actorRole: 'PLANNER' })).toBe(false);
    expect(canCreate({ actorUserId: 'x', actorRole: 'REQUESTER' })).toBe(true);
    expect(canCreate({ actorUserId: 'x', actorRole: 'ADMIN' })).toBe(true);
  });

  it('sahibi kendi çağrısını iptal edebilir', () => {
    const req = makeRequest();
    expect(canCancel(req, { actorUserId: 'u-requester', actorRole: 'REQUESTER' })).toBe(true);
  });

  it('sahibi olmayan REQUESTER başkasının çağrısını iptal edemez', () => {
    const req = makeRequest();
    expect(canCancel(req, { actorUserId: 'baska-kullanici', actorRole: 'REQUESTER' })).toBe(false);
  });

  it('SUPERVISOR yalnızca kendi bölümündeki çağrıyı iptal edebilir', () => {
    const req = makeRequest();
    expect(canCancel(req, { actorUserId: 'amir-1', actorRole: 'SUPERVISOR', actorDeptId: 'MONTAJ-1' })).toBe(true);
    expect(canCancel(req, { actorUserId: 'amir-1', actorRole: 'SUPERVISOR', actorDeptId: 'BASKA-BOLUM' })).toBe(false);
  });

  it('ADMIN her çağrıyı iptal edebilir', () => {
    const req = makeRequest();
    expect(canCancel(req, { actorUserId: 'admin-1', actorRole: 'ADMIN' })).toBe(true);
  });

  it('öncelik değiştirmeyi yalnızca SUPERVISOR ve ADMIN yapabilir', () => {
    expect(canChangePriority({ actorUserId: 'x', actorRole: 'SUPERVISOR' })).toBe(true);
    expect(canChangePriority({ actorUserId: 'x', actorRole: 'ADMIN' })).toBe(true);
    expect(canChangePriority({ actorUserId: 'x', actorRole: 'SUPPLIER' })).toBe(false);
    expect(canChangePriority({ actorUserId: 'x', actorRole: 'REQUESTER' })).toBe(false);
  });

  it('talep sahibi teslim onayı verebilir', () => {
    const req = makeRequest({ state: 'DELIVERED' });
    expect(canClose(req, { actorUserId: 'u-requester', actorRole: 'REQUESTER' })).toBe(true);
  });

  it('personel yönetimini yalnızca SUPERVISOR ve ADMIN yapabilir', () => {
    expect(canManageStaff({ actorUserId: 'x', actorRole: 'SUPERVISOR' })).toBe(true);
    expect(canManageStaff({ actorUserId: 'x', actorRole: 'SUPPLIER' })).toBe(false);
  });

  it('görünürlük kapsamı role göre doğru daralır', () => {
    expect(visibleRequestScope({ actorUserId: 'x', actorRole: 'REQUESTER' })).toBe('OWN');
    expect(visibleRequestScope({ actorUserId: 'x', actorRole: 'SUPPLIER' })).toBe('SUPPLIER_DEPT');
    expect(visibleRequestScope({ actorUserId: 'x', actorRole: 'SUPERVISOR' })).toBe('DEPT_WIDE');
    expect(visibleRequestScope({ actorUserId: 'x', actorRole: 'PLANNER' })).toBe('ALL');
    expect(visibleRequestScope({ actorUserId: 'x', actorRole: 'ADMIN' })).toBe('ALL');
  });
});
