// src/infrastructure/db/models/RequestCache.ts
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';
import type { RequestLine } from '../../../contracts/types';

function sanitizeLines(raw: unknown): RequestLine[] {
  return Array.isArray(raw) ? (raw as RequestLine[]) : [];
}

/**
 * Plan Bölüm 10.1 MATERIAL_REQUEST + Bölüm 10.3 "requests_cache (son 7 gün +
 * tüm aktif çağrılar)". `lines_json` için bkz. schema.ts dosya başı notu
 * (bilinçli basitleştirme — REQUEST_LINE ayrı tablo değil).
 */
export default class RequestCache extends Model {
  static table = 'requests_cache';

  @field('server_id') serverId?: string;
  @field('request_no') requestNo?: string;
  @field('requester_user_id') requesterUserId: string;
  @field('requester_dept_id') requesterDeptId: string;
  @field('supplier_dept_id') supplierDeptId: string;
  @field('state') state: string;
  @field('priority') priority: string;
  @field('delivery_location_id') deliveryLocationId?: string;
  @json('lines_json', sanitizeLines) lines: RequestLine[];
  @field('created_at_iso') createdAtIso: string;
  @field('sla_due_at_iso') slaDueAtIso?: string;
  @field('closed_at_iso') closedAtIso?: string;
  @field('client_request_id') clientRequestId: string;
  @field('note') note?: string;
  @field('transport_order_id') transportOrderId?: string;
}
