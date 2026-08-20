// src/infrastructure/db/models/OutboxRecord.ts
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';
import type { OutboxOperation, OutboxStatus } from '../../../contracts/types';

function sanitizePayload(raw: unknown): unknown {
  return raw ?? null;
}

function sanitizeLastError(raw: unknown): { code: string; message: string } | null {
  if (raw && typeof raw === 'object' && 'code' in raw && 'message' in raw) {
    return raw as { code: string; message: string };
  }
  return null;
}

/**
 * Plan Bölüm 7.4 + 12.4 "OutboxEntry" — çevrimdışıyken kuyruklanan mutasyonlar.
 * Model adı `OutboxRecord` (contracts/types.ts'teki `OutboxEntry` arayüzüyle
 * isim çakışmasın diye); alan isimleri o arayüzle birebir eşleşir.
 */
export default class OutboxRecord extends Model {
  static table = 'outbox';

  @field('client_request_id') clientRequestId: string; // = OutboxEntry.id (idempotency anahtarı)
  @field('operation') operation: OutboxOperation;
  @field('target_id') targetId?: string;
  @json('payload_json', sanitizePayload) payload: unknown;
  @field('attempts') attempts: number;
  @field('next_attempt_at') nextAttemptAt: number;
  @field('created_at') createdAt: number;
  @field('status') status: OutboxStatus;
  @json('last_error_json', sanitizeLastError) lastError: { code: string; message: string } | null;
}
