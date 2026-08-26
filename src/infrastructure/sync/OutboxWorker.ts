// src/infrastructure/sync/OutboxWorker.ts
//
// Plan Bölüm 7.4 (offline senaryosu) + 12.4 (OutboxWorker) — karar mantığı
// outboxScheduler.ts'te (saf, test edilmiş); bu dosya o kararları gerçek
// WatermelonDB kayıtlarına ve enjekte edilmiş bir `dispatch` fonksiyonuna
// uygular. `dispatch` enjekte edilir çünkü backend uçları (Plan §11.1
// /requests, /requests/{id}/acknowledge vb.) henüz yok — gerçek API'ler
// hazır olduğunda tek değişiklik, uygulamanın bu worker'ı hangi `dispatch`
// ile kurduğu olacak (bkz. RealtimeClient.ts'teki izolasyon prensibiyle
// aynı desen, Plan Bölüm 8.2 madde 2).
//
// KULLANIM NOTU: WatermelonDB SQLite adaptörü native modül gerektirdiği için
// (bkz. infrastructure/db/index.ts) bu dosya yalnızca dev-client build'inde
// çalıştırılabilir; Jest testleri outboxScheduler.ts'in saf mantığını hedefler.

import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { OutboxEntry, OutboxOperation } from '../../contracts/types';
import OutboxRecord from '../db/models/OutboxRecord';
import { computeBackoffMs, isPermanentHttpError, selectRunnableEntries, isQueueBacklogged } from './outboxScheduler';

export type DispatchResult = { ok: true } | { ok: false; statusCode: number; message?: string };
export type Dispatch = (entry: OutboxEntry) => Promise<DispatchResult>;

function toOutboxEntry(record: OutboxRecord): OutboxEntry {
  return {
    id: record.clientRequestId,
    operation: record.operation,
    targetId: record.targetId ?? null,
    payload: record.payload,
    attempts: record.attempts,
    nextAttemptAt: record.nextAttemptAt,
    createdAt: record.createdAt,
    status: record.status,
    lastError: record.lastError ?? undefined,
  };
}

export class OutboxWorker {
  private processing = false;
  private rerunRequested = false;

  constructor(
    private readonly database: Database,
    private readonly dispatch: Dispatch,
  ) {}

  /** Plan §7.4: her offline işlem clientRequestId (UUID v4) taşır — burada üretilir. */
  async enqueue(operation: OutboxOperation, targetId: string | null, payload: unknown): Promise<string> {
    const clientRequestId = `cr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const collection = this.database.get<OutboxRecord>('outbox');
    await this.database.write(async () => {
      await collection.create((record) => {
        record.clientRequestId = clientRequestId;
        record.operation = operation;
        record.targetId = targetId ?? undefined;
        record.payload = payload;
        record.attempts = 0;
        record.nextAttemptAt = Date.now();
        record.createdAt = Date.now();
        record.status = 'QUEUED';
      });
    });
    return clientRequestId;
  }

  async processQueue(): Promise<void> {
    if (this.processing) {
      // Zaten bir çalışma sürüyor — bu sırada kuyruğa YENİ eklenen kayıtlar
      // (örn. sepetten art arda birden fazla talep gönderilirken) mevcut
      // çalışmanın başında çekilen listede yer almamış olabilir. Bu bayrak,
      // mevcut çalışma bitince kuyruğun otomatik olarak TEKRAR taranmasını
      // sağlar — aksi halde geç eklenen kayıtlar sessizce hiç işlenmeden kalırdı.
      this.rerunRequested = true;
      return;
    }
    this.processing = true;
    try {
      const collection = this.database.get<OutboxRecord>('outbox');
      const pending = await collection
        .query(Q.where('status', Q.oneOf(['QUEUED', 'SENDING'])))
        .fetch();

      const entries = pending.map(toOutboxEntry);
      const runnable = selectRunnableEntries(entries, Date.now());
      const runnableIds = new Set(runnable.map((e) => e.id));
      const runnableRecords = pending.filter((r) => runnableIds.has(r.clientRequestId));

      await Promise.all(runnableRecords.map((record) => this.processOne(record)));
    } finally {
      this.processing = false;
      if (this.rerunRequested) {
        this.rerunRequested = false;
        void this.processQueue();
      }
    }
  }

  /** Plan §12.4 kural 6: "Kuyruk boyutu > 50 → kullanıcıya uyarı." UI bu sayıyı okur. */
  async getPendingCount(): Promise<number> {
    const collection = this.database.get<OutboxRecord>('outbox');
    return collection.query(Q.where('status', Q.oneOf(['QUEUED', 'SENDING']))).fetchCount();
  }

  async isBacklogged(): Promise<boolean> {
    return isQueueBacklogged(await this.getPendingCount());
  }

  private async processOne(record: OutboxRecord): Promise<void> {
    await this.database.write(async () => record.update((r) => { r.status = 'SENDING'; }));

    const entry = toOutboxEntry(record);
    let result: DispatchResult;
    try {
      result = await this.dispatch(entry);
    } catch {
      result = { ok: false, statusCode: 0, message: 'Ağ hatası' };
    }

    if (result.ok) {
      // Başarılı — kuyruktan düşer (Plan §12.4 kural 2/4 sonucu).
      await this.database.write(async () => record.destroyPermanently());
      return;
    }

    if (result.statusCode === 409) {
      // Plan §12.4 kural 4: "409 Conflict → sunucu durumu çekilir, yerel kayıt
      // düzeltilir, kullanıcıya bilgi kartı gösterilir, kuyruktan düşer."
      // Sunucu durumunu çekme/yerel kaydı düzeltme sorumluluğu çağıran katmana
      // (CatalogSync/senkron mantığı) aittir — worker yalnızca kuyruktan düşürür.
      await this.database.write(async () => record.destroyPermanently());
      return;
    }

    if (isPermanentHttpError(result.statusCode)) {
      // Plan §12.4 kural 3: kalıcı hata -> FAILED_PERMANENT, "Çözüm gerekiyor" listesi.
      await this.database.write(async () =>
        record.update((r) => {
          r.status = 'FAILED_PERMANENT';
          r.lastError = { code: String(result.statusCode), message: result.message ?? 'Kalıcı hata' };
        }),
      );
      return;
    }

    // Geçici hata (5xx/timeout/ağ) — backoff ile yeniden dene.
    const nextAttempts = record.attempts + 1;
    await this.database.write(async () =>
      record.update((r) => {
        r.status = 'QUEUED';
        r.attempts = nextAttempts;
        r.nextAttemptAt = Date.now() + computeBackoffMs(nextAttempts);
        r.lastError = { code: String(result.statusCode), message: result.message ?? 'Geçici hata' };
      }),
    );
  }
}
