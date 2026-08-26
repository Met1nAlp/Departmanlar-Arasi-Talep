// src/infrastructure/sync/CatalogSync.ts
//
// Plan Bölüm 12.3 klasör yapısı + Bölüm 10.3.
//
// KAPSAM DEĞİŞTİ (2026-08-25): Bu senkron artık SADECE departmanları
// yönetiyor. Ürünler (Part/PartBarcode) buradan tamamen çıkarıldı — onlar
// artık api/products.ts'teki upsertProductsLocally() ile GERÇEK GET_PARTS
// cevabından besleniyor. Bu senkron eskiden olduğu gibi parts/part_barcodes
// tablolarını silip yeniden yazsaydı, gerçek sunucudan gelip kaydedilmiş
// ürün verisini yanlışlıkla silerdi — bu yüzden buradan tamamen kaldırıldı.
//
// Backend departman ucu henüz yok (mocks/catalog.ts geçici kaynak). Backend
// hazır olduğunda yalnızca fetchRemoteCatalog() içi değişecek.

import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { Department as ContractDepartment } from '../../contracts/types';
import Department from '../db/models/Department';
import KvStoreEntry from '../db/models/KvStoreEntry';
import { mockCatalogDepartments, mockCatalogVersion } from '../../mocks/catalog';

const CATALOG_VERSION_KEY = 'catalogVersion';

interface RemoteCatalog {
  version: string;
  departments: ContractDepartment[];
}

/** MOCK — backend departman ucu geldiğinde gerçek fetch'e dönüşecek. */
async function fetchRemoteCatalog(): Promise<RemoteCatalog> {
  return {
    version: mockCatalogVersion,
    departments: mockCatalogDepartments,
  };
}

async function getLocalCatalogVersion(database: Database): Promise<string | null> {
  const collection = database.get<KvStoreEntry>('kv_store');
  const rows = await collection.query(Q.where('key', CATALOG_VERSION_KEY)).fetch();
  return rows[0]?.value ?? null;
}

/**
 * Departman kataloğunu senkronize eder. Yerel sürüm zaten güncelse hiçbir
 * şey yapmaz. ÜRÜNLERE DOKUNMAZ — onların kaynağı ayrı (bkz. dosya başı notu).
 */
export async function syncCatalog(database: Database): Promise<{ synced: boolean }> {
  const localVersion = await getLocalCatalogVersion(database);
  const remote = await fetchRemoteCatalog();
  if (localVersion === remote.version) {
    return { synced: false };
  }

  const departmentsCol = database.get<Department>('departments');
  const kvCol = database.get<KvStoreEntry>('kv_store');

  const [existingDepts, existingVersionRows] = await Promise.all([
    departmentsCol.query().fetch(),
    kvCol.query(Q.where('key', CATALOG_VERSION_KEY)).fetch(),
  ]);

  await database.write(async () => {
    const deletions = existingDepts.map((r) => r.prepareDestroyPermanently());

    const departmentCreations = remote.departments.map((d) =>
      departmentsCol.prepareCreate((row) => {
        row._raw.id = d.id;
        row.code = d.code;
        row.name = d.name;
        row.type = d.type;
        row.parentId = d.parentId;
      }),
    );

    const versionUpsert = existingVersionRows[0]
      ? existingVersionRows[0].prepareUpdate((row) => {
          row.value = remote.version;
        })
      : kvCol.prepareCreate((row) => {
          row.key = CATALOG_VERSION_KEY;
          row.value = remote.version;
        });

    await database.batch(...deletions, ...departmentCreations, versionUpsert);
  });

  return { synced: true };
}