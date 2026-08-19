// src/infrastructure/db/models/KvStoreEntry.ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/**
 * Plan Bölüm 10.3 "kv_store (lastSeq, katalog sürümü, cihaz ayarları)".
 * Basit anahtar-değer deposu — her satır tek bir ayarı tutar.
 */
export default class KvStoreEntry extends Model {
  static table = 'kv_store';

  @field('key') key!: string;
  @field('value') value!: string;
}
