// src/infrastructure/db/models/EventLogLocal.ts
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

function sanitizePayload(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
}

/**
 * Plan Bölüm 10.3 "event_log_local (son 500 olay — replay için lastSeq
 * takibi)". `seq` alanı RealtimeClient.lastSeq ile aynı sayaçtır (Plan §9.2).
 */
export default class EventLogLocal extends Model {
  static table = 'event_log_local';

  @field('seq') seq!: number;
  @field('request_id') requestId!: string;
  @field('event_type') eventType!: string;
  @field('from_state') fromState?: string;
  @field('to_state') toState!: string;
  @field('actor_user_id') actorUserId?: string;
  @field('device_id') deviceId?: string;
  @json('payload_json', sanitizePayload) payload!: Record<string, unknown> | null;
  @field('occurred_at_iso') occurredAtIso!: string;
}
