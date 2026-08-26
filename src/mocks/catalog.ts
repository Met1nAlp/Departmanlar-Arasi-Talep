// src/mocks/catalog.ts
//
// CatalogSync'in kaynağı — SADECE departmanlar için. Barış'ın sunucusunda
// henüz departman listesi döndüren bir komut (GET_DEPARTMENTS gibi) yok, bu
// yüzden departmanlar hâlâ buradan geliyor.
//
// ÜRÜNLER (Part/PartBarcode) BURADAN KALDIRILDI (2026-08-25) — artık gerçek
// kaynaktan geliyor: api/products.ts'teki getProductsByDepartment/getProductsByIds,
// GET_PARTS'tan gelen gerçek sunucu verisini yerel parts/part_barcodes
// tablolarına upsert ediyor (bkz. upsertProductsLocally). Bir cihaz hiç
// sunucuya bağlanmadıysa ürün listesi boş kalır — bu bilinçli bir karar,
// sahte/mock ürün asla gösterilmesin diye.
//
// ÖNEMLİ: Department.id, api/departments.ts'in döndürdüğü Department.id
// (yani departman CODE'u — "elektronik_uretim" gibi) ile AYNI formatta.

import type { Department, Location, Part } from '../contracts/types';

export const mockCatalogVersion = '2026-08-25T00:00:00Z';

export const mockCatalogDepartments: Department[] = [
  { id: 'd-elektronik-uretim', code: 'elektronik_uretim', name: 'Elektronik Üretim', type: 'PRODUCTION' },
  { id: 'd-sac-atolyesi', code: 'sac_atolyesi', name: 'Saç Atölyesi', type: 'PRODUCTION' },
  { id: 'd-talasli-imalat', code: 'talasli_imalat', name: 'Talaşlı İmalat', type: 'PRODUCTION' },
];

export const mockCatalogLocations: Location[] = [];

export const mockCatalogParts: Part[] = [];