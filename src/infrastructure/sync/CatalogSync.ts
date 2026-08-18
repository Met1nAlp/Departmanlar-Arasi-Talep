// src/infrastructure/sync/CatalogSync.ts
//
// Plan Bölüm 12.3 klasör yapısı + Bölüm 10.3 "Delta senkronizasyon: Katalog
// GET /catalog/sync?since=<version> ile çekilir; yalnızca değişenler iner."
//
// Backend ucu henüz yok (mocks/catalog.ts geçici kaynak). Bu yüzden burada
// GERÇEK delta değil, "versiyon değiştiyse tam değiştir" yapılıyor — ama
// arayüz (syncCatalog()) ve kv_store'da sürüm takibi kalıcı sözleşmedir;
// backend hazır olduğunda yalnızca `fetchRemoteCatalog()` içi değişecek
// (mock diziler yerine gerçek fetch), geri kalan kod aynı kalır.

import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { Department as ContractDepartment, Location as ContractLocation, Part as ContractPart } from '../../contracts/types';
import Department from '../db/models/Department';
import Location from '../db/models/Location';
import Part from '../db/models/Part';
import PartBarcode from '../db/models/PartBarcode';
import KvStoreEntry from '../db/models/KvStoreEntry';
import { mockCatalogDepartments, mockCatalogLocations, mockCatalogParts, mockCatalogVersion } from '../../mocks/catalog';

const CATALOG_VERSION_KEY = 'catalogVersion';

interface RemoteCatalog {
  version: string;
  departments: ContractDepartment[];
  locations: ContractLocation[];
  parts: ContractPart[];
}

/** MOCK — backend geldiğinde `GET /catalog/sync?since=<version>` çağrısına dönüşecek. */
async function fetchRemoteCatalog(): Promise<RemoteCatalog> {
  return {
    version: mockCatalogVersion,
    departments: mockCatalogDepartments,
    locations: mockCatalogLocations,
    parts: mockCatalogParts,
  };
}

async function getLocalCatalogVersion(database: Database): Promise<string | null> {
  const collection = database.get<KvStoreEntry>('kv_store');
  const rows = await collection.query(Q.where('key', CATALOG_VERSION_KEY)).fetch();
  return rows[0]?.value ?? null;
}

/**
 * Katalogu senkronize eder. Yerel sürüm zaten güncelse ağa hiç gitmez (mock'ta
 * bu kontrol anlamsız görünse de gerçek backend'de gereksiz veri çekimini
 * önleyen asıl kural budur).
 */
export async function syncCatalog(database: Database): Promise<{ synced: boolean }> {
  const localVersion = await getLocalCatalogVersion(database);
  const remote = await fetchRemoteCatalog();
  if (localVersion === remote.version) {
    return { synced: false };
  }

  const departmentsCol = database.get<Department>('departments');
  const locationsCol = database.get<Location>('locations');
  const partsCol = database.get<Part>('parts');
  const barcodesCol = database.get<PartBarcode>('part_barcodes');
  const kvCol = database.get<KvStoreEntry>('kv_store');

  const [existingDepts, existingLocs, existingParts, existingBarcodes, existingVersionRows] = await Promise.all([
    departmentsCol.query().fetch(),
    locationsCol.query().fetch(),
    partsCol.query().fetch(),
    barcodesCol.query().fetch(),
    kvCol.query(Q.where('key', CATALOG_VERSION_KEY)).fetch(),
  ]);

  await database.write(async () => {
    const deletions = [
      ...existingDepts.map((r) => r.prepareDestroyPermanently()),
      ...existingLocs.map((r) => r.prepareDestroyPermanently()),
      ...existingParts.map((r) => r.prepareDestroyPermanently()),
      ...existingBarcodes.map((r) => r.prepareDestroyPermanently()),
    ];

    const departmentCreations = remote.departments.map((d) =>
      departmentsCol.prepareCreate((row) => {
        row._raw.id = d.id;
        row.code = d.code;
        row.name = d.name;
        row.type = d.type;
        row.parentId = d.parentId;
      }),
    );

    const locationCreations = remote.locations.map((l) =>
      locationsCol.prepareCreate((row) => {
        row._raw.id = l.id;
        row.departmentId = l.departmentId;
        row.code = l.code;
        row.kind = l.kind;
        row.mapRef = l.mapRef;
      }),
    );

    const partCreations = remote.parts.map((p) =>
      partsCol.prepareCreate((row) => {
        row._raw.id = p.id;
        row.partNo = p.partNo;
        row.revision = p.revision;
        row.descriptionTr = p.descriptionTr;
        row.descriptionEn = p.descriptionEn;
        row.uom = p.uom;
        row.serialTracked = p.serialTracked;
        row.lotTracked = p.lotTracked;
        row.minStock = p.minStock;
        row.defaultSupplierDeptId = p.defaultSupplierDeptId;
        row.attributes = p.attributes ?? {};
      }),
    );

    const barcodeCreations = remote.parts.flatMap((p) =>
      p.barcodes.map((b) =>
        barcodesCol.prepareCreate((row) => {
          row._raw.id = b.id;
          row.partId = b.partId;
          row.symbology = b.symbology;
          row.rawValue = b.rawValue;
          row.parsedGtin = b.parsedGtin;
          row.isPrimary = b.isPrimary;
        }),
      ),
    );

    const versionUpsert = existingVersionRows[0]
      ? existingVersionRows[0].prepareUpdate((row) => {
          row.value = remote.version;
        })
      : kvCol.prepareCreate((row) => {
          row.key = CATALOG_VERSION_KEY;
          row.value = remote.version;
        });

    await database.batch(
      ...deletions,
      ...departmentCreations,
      ...locationCreations,
      ...partCreations,
      ...barcodeCreations,
      versionUpsert,
    );
  });

  return { synced: true };
}
