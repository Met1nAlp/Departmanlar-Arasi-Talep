// src/contracts/types.ts
//
// @mts/contracts — MTS Mobil ve Backend arasında paylaşılan tip sözleşmesi.
// Kaynak: MEPSAN_MTS_Proje_Plani.md v1.0, Bölüm 6 (Roller), Bölüm 7.1 (Durum makinesi),
// Bölüm 9.3 (Olay şeması), Bölüm 10 (Veri modeli), Bölüm 11 (API sözleşmesi).
//
// KURAL: Bu dosya hiçbir şey import etmez (React, fetch, SQLite yok).
// Domain katmanı ve UI katmanı bu tipleri kullanır, bu dosya onları kullanmaz.

// ---------------------------------------------------------------------------
// 1. Roller (Plan Bölüm 6.2)
// ---------------------------------------------------------------------------

/**
 * Rol, KULLANICIYA değil KULLANICI-BÖLÜM ikilisine atanır (bkz. UserRoleAssignment).
 * Aynı kişi A bölümünde REQUESTER, B bölümünde SUPPLIER olabilir.
 */
export type Role = 'REQUESTER' | 'SUPPLIER' | 'SUPERVISOR' | 'PLANNER' | 'ADMIN';

export const ROLES: readonly Role[] = ['REQUESTER', 'SUPPLIER', 'SUPERVISOR', 'PLANNER', 'ADMIN'];

/**
 * Mevcut prototipteki (Türkçe) rol isimleri ile plandaki resmi rol isimleri arasındaki
 * eşleme. Ekranlar kademeli olarak Role tipine geçene kadar bu harita kullanılır.
 */
export const LEGACY_ROLE_MAP = {
  saha_personeli: 'REQUESTER',
  departman_yetkilisi: 'SUPPLIER',
  yonetici: 'PLANNER',
} as const satisfies Record<string, Role>;

export type LegacyRole = keyof typeof LEGACY_ROLE_MAP;

// ---------------------------------------------------------------------------
// 2. Çağrı durum makinesi (Plan Bölüm 7.1)
// ---------------------------------------------------------------------------

export type RequestState =
  | 'DRAFT'
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'REJECTED'
  | 'PREPARING'
  | 'PARTIALLY_READY'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'EXCEPTION'
  | 'MANUAL_HANDOVER'
  | 'DELIVERED'
  | 'ESCALATED'
  | 'CLOSED'
  | 'CANCELLED';

export const REQUEST_STATES: readonly RequestState[] = [
  'DRAFT',
  'PENDING',
  'ACKNOWLEDGED',
  'REJECTED',
  'PREPARING',
  'PARTIALLY_READY',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'EXCEPTION',
  'MANUAL_HANDOVER',
  'DELIVERED',
  'ESCALATED',
  'CLOSED',
  'CANCELLED',
];

/** Terminal durumlar — bu durumlardan çıkış yoktur; düzeltme için yeni çağrı açılır. */
export const TERMINAL_STATES: readonly RequestState[] = ['CLOSED', 'CANCELLED'];

export type Priority = 'LINE_DOWN' | 'URGENT' | 'NORMAL' | 'PLANNED';

export const PRIORITIES: readonly Priority[] = ['LINE_DOWN', 'URGENT', 'NORMAL', 'PLANNED'];

/** SLA süreleri (dakika). PLANNED için "vardiya sonu" ayrı ele alınır (bkz. SlaPolicy). */
export const PRIORITY_SLA_MINUTES: Record<Exclude<Priority, 'PLANNED'>, number> = {
  LINE_DOWN: 5,
  URGENT: 15,
  NORMAL: 60,
};

// ---------------------------------------------------------------------------
// 3. Temel varlıklar (Plan Bölüm 10.1)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  code: string; // "MONTAJ-1"
  name: string;
  type: 'PRODUCTION' | 'WAREHOUSE' | 'BOTH';
  parentId?: string;
}

export interface Location {
  id: string;
  departmentId: string;
  code: string; // "A-12-03"
  kind: 'SHELF' | 'LINESIDE' | 'DROP_POINT' | 'CHARGER';
  mapRef?: string; // AGV node id
}

export interface User {
  id: string;
  employeeNo: string;
  fullName: string;
  badgeUid?: string; // NFC opsiyonel
  isActive: boolean;
  lastSeenAt?: string; // ISO-8601
}

/** Zaman aralıklı, kullanıcı-bölüm-rol ataması. Bkz. Plan Bölüm 6.2 "Önemli tasarım kararı". */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  departmentId: string;
  role: Role;
  validFrom: string;
  validTo?: string;
}

export interface SupervisorLink {
  id: string;
  supervisorUserId: string;
  memberUserId: string;
  departmentId: string;
}

export type BarcodeSymbology = 'DATAMATRIX' | 'CODE128' | 'QR' | 'EAN13';

export interface PartBarcode {
  id: string;
  partId: string;
  symbology: BarcodeSymbology;
  rawValue: string;
  parsedGtin?: string;
  isPrimary: boolean;
}

export interface Part {
  id: string;
  partNo: string;
  revision: string;
  descriptionTr: string;
  descriptionEn?: string;
  uom: 'ADET' | 'KG' | 'MT' | 'SET';
  serialTracked: boolean;
  lotTracked: boolean;
  minStock: number;
  defaultSupplierDeptId?: string;
  barcodes: PartBarcode[];
  attributes?: Record<string, unknown>;
}

export interface ContainerType {
  id: string;
  code: string; // "KLT-4314"
  capacity: number;
  maxWeightKg: number;
}

// ---------------------------------------------------------------------------
// 4. Çağrı (MaterialRequest) — Plan Bölüm 10.1 + 10.2
// ---------------------------------------------------------------------------

export interface SerialCapture {
  id: string;
  requestLineId: string;
  serialNo: string;
  lotNo?: string;
  scannedAt: string;
  scannedBy: string;
}

export interface RequestLine {
  id: string;
  requestId: string;
  partId: string;
  qtyRequested: number;
  qtyPrepared?: number;
  qtyDelivered?: number;
  shortageReason?: string;
  containerTypeId?: string;
  serials?: SerialCapture[];
}

/**
 * Bir malzeme çağrısı. Plandaki tek satır (Bölüm 10.1 basitleştirilmiş) yerine
 * çok satırlı (RequestLine[]) model kullanılır — MVP'de tek satır da geçerlidir,
 * ama şema baştan çok satırlı kurulmalıdır (Plan Bölüm 1, "kritik veri kararları").
 */
export interface MaterialRequest {
  id: string;
  requestNo: string; // insan okunabilir: "MR-2026-004182"
  requesterUserId: string;
  requesterDeptId: string;
  supplierDeptId: string;
  state: RequestState;
  priority: Priority;
  deliveryLocationId?: string;
  lines: RequestLine[];
  createdAt: string;
  slaDueAt?: string;
  closedAt?: string;
  clientRequestId: string; // idempotency anahtarı (UUID v4)
  note?: string;
  transportOrderId?: string;
}

// ---------------------------------------------------------------------------
// 5. Taşıma emri / araç (Plan Bölüm 9.4, 10.1)
// ---------------------------------------------------------------------------

export type TransportOrderState =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface TransportNode {
  id: string;
  transportOrderId: string;
  sequenceNo: number;
  locationId: string;
  action: 'PICKUP' | 'DROP';
  state: 'PENDING' | 'ARRIVED' | 'DONE';
}

export interface TransportOrder {
  id: string;
  orderNo: string;
  vehicleId?: string;
  state: TransportOrderState;
  nodes: TransportNode[];
  dispatchedAt?: string;
  completedAt?: string;
}

export interface Vehicle {
  id: string;
  serialNo: string;
  vendor: string;
  state: string;
  batteryPct: number;
  lastStateAt: string;
}

// ---------------------------------------------------------------------------
// 6. Cihaz / oturum (Plan Bölüm 10.1, 14)
// ---------------------------------------------------------------------------

export interface Device {
  id: string;
  deviceUid: string;
  departmentId: string;
  mode: 'REQUESTER' | 'SUPPLIER' | 'DUAL';
  appVersion: string;
  enrolledAt: string;
  isActive: boolean;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  endReason?: 'MANUAL' | 'TIMEOUT' | 'REVOKED' | 'SHIFT_END';
}

// ---------------------------------------------------------------------------
// 7. Denetim izi (Plan Bölüm 10.1, 15.1)
// ---------------------------------------------------------------------------

export interface RequestEvent {
  seq: number;
  requestId: string;
  eventType: string;
  fromState: RequestState | null;
  toState: RequestState;
  actorUserId?: string;
  deviceId?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
}

// ---------------------------------------------------------------------------
// 8. Gerçek zaman olay zarfı (Plan Bölüm 9.3)
// ---------------------------------------------------------------------------

export type EventType =
  | 'request.created'
  | 'request.acknowledged'
  | 'request.rejected'
  | 'request.preparing'
  | 'request.ready'
  | 'request.in_transit'
  | 'request.delivered'
  | 'request.closed'
  | 'request.cancelled'
  | 'request.escalated'
  | 'request.priority_changed'
  | 'agv.status'
  | 'catalog.updated'
  | 'session.revoked'
  | 'device.command';

export type EventActor = { userId: string; deviceId: string } | { system: 'AGV' | 'SCHEDULER' };

export interface EventEnvelope<T = unknown> {
  seq: number;
  id: string; // ULID
  type: EventType;
  occurredAt: string;
  actor: EventActor;
  channel: string; // "dept:MONTAJ-1"
  payload: T;
}

// ---------------------------------------------------------------------------
// 9. Idempotency / offline yardımcı tipleri (Plan Bölüm 7.4, 12.4)
// ---------------------------------------------------------------------------

export type OutboxOperation = 'CREATE_REQUEST' | 'ACKNOWLEDGE' | 'READY' | 'CLOSE' | 'CANCEL';
export type OutboxStatus = 'QUEUED' | 'SENDING' | 'FAILED_PERMANENT';

export interface OutboxEntry {
  id: string; // clientRequestId
  operation: OutboxOperation;
  targetId: string | null;
  payload: unknown;
  attempts: number;
  nextAttemptAt: number;
  createdAt: number;
  status: OutboxStatus;
  lastError?: { code: string; message: string };
}
