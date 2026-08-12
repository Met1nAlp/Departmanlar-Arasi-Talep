// src/domain/request/RequestPolicies.ts
//
// Yetki politikaları — plan Bölüm 6.3 "Yetki matrisi (RBAC)" tablosunun kod hâli.
// Not (Bölüm 6.3 uygulama notu): "Yetki kontrolü iki katmanda yapılır — mobil
// tarafta UI gizleme (kullanılabilirlik için), sunucu tarafında zorunlu kontrol
// (güvenlik için). Mobil taraftaki kontrol asla güvenlik sınırı sayılmaz."
// Yani bu dosya sadece UI'ı doğru göstermek içindir; gerçek yetkilendirme backend'de.

import type { MaterialRequest, Role } from '../../contracts/types';

export interface PolicyContext {
  actorUserId: string;
  actorRole: Role;
  /** actorRole SUPERVISOR ise ve bölüm-içi kontrolü gerekiyorsa kullanılır. */
  actorDeptId?: string;
}

const isOwner = (request: MaterialRequest, ctx: PolicyContext) => request.requesterUserId === ctx.actorUserId;

const isSameDept = (request: MaterialRequest, ctx: PolicyContext) =>
  ctx.actorDeptId != null &&
  (request.requesterDeptId === ctx.actorDeptId || request.supplierDeptId === ctx.actorDeptId);

/** Çağrı oluştur — RBAC: REQUESTER ✅ SUPPLIER ✅ SUPERVISOR ✅ PLANNER ❌ ADMIN ✅ */
export function canCreate(ctx: PolicyContext): boolean {
  return ctx.actorRole !== 'PLANNER';
}

/**
 * Kendi çağrısını iptal et (herkes) vs. başkasının çağrısını iptal et (yalnızca
 * SUPERVISOR bölüm içi, veya ADMIN her yerde). RBAC satır 2 ve 3.
 */
export function canCancel(request: MaterialRequest, ctx: PolicyContext): boolean {
  if (ctx.actorRole === 'ADMIN') return true;
  if (isOwner(request, ctx)) return ctx.actorRole !== 'PLANNER';
  if (ctx.actorRole === 'SUPERVISOR') return isSameDept(request, ctx);
  return false;
}

/** Öncelik değiştir — RBAC: yalnızca SUPERVISOR ve ADMIN. */
export function canChangePriority(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'SUPERVISOR' || ctx.actorRole === 'ADMIN';
}

/** Hazırlandı onayı (ACKNOWLEDGED→PREPARING→READY_FOR_PICKUP eylemleri) — SUPPLIER+ */
export function canAcknowledgeOrPrepare(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'SUPPLIER' || ctx.actorRole === 'SUPERVISOR' || ctx.actorRole === 'ADMIN';
}

/** Teslim onayı (DELIVERED→CLOSED) — RBAC: REQUESTER ✅ SUPERVISOR ✅ ADMIN ✅ */
export function canClose(request: MaterialRequest, ctx: PolicyContext): boolean {
  if (ctx.actorRole === 'ADMIN' || ctx.actorRole === 'SUPERVISOR') return isSameDept(request, ctx) || ctx.actorRole === 'ADMIN';
  return isOwner(request, ctx);
}

/** Miktar farkı / kısmi karşılama girişi — RBAC: SUPPLIER ✅ SUPERVISOR ✅ ADMIN ✅ */
export function canReportShortage(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'SUPPLIER' || ctx.actorRole === 'SUPERVISOR' || ctx.actorRole === 'ADMIN';
}

/** Alt personel tanımla — RBAC: yalnızca SUPERVISOR ve ADMIN. */
export function canManageStaff(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'SUPERVISOR' || ctx.actorRole === 'ADMIN';
}

/** Denetim kaydını görüntüle — RBAC: SUPERVISOR (bölüm) ✅ PLANNER ✅ ADMIN ✅ */
export function canViewAudit(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'SUPERVISOR' || ctx.actorRole === 'PLANNER' || ctx.actorRole === 'ADMIN';
}

/** Katalog düzenle / cihaz kaydı — RBAC: yalnızca ADMIN. */
export function canManageCatalogOrDevices(ctx: PolicyContext): boolean {
  return ctx.actorRole === 'ADMIN';
}

/**
 * Çağrı kuyruğu görünürlüğü — RBAC "Çağrı kuyruğunu gör" satırı:
 * REQUESTER: kendi · SUPPLIER: bölümüne düşen · SUPERVISOR: bölüm geneli · PLANNER/ADMIN: tümü
 */
export function visibleRequestScope(ctx: PolicyContext): 'OWN' | 'SUPPLIER_DEPT' | 'DEPT_WIDE' | 'ALL' {
  switch (ctx.actorRole) {
    case 'REQUESTER':
      return 'OWN';
    case 'SUPPLIER':
      return 'SUPPLIER_DEPT';
    case 'SUPERVISOR':
      return 'DEPT_WIDE';
    case 'PLANNER':
    case 'ADMIN':
      return 'ALL';
  }
}
