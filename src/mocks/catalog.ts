// src/mocks/catalog.ts
//
// CatalogSync'in kaynağı — Plan Bölüm 11.1 "GET /catalog/sync?since=<version>"
// gerçek uç henüz yok, bu dosya onun yerini tutar. `@mts/contracts` tipleriyle
// (Part, Department, Location) uyumlu; backend geldiğinde CatalogSync.ts'te
// yalnızca veri kaynağı (bu dosya yerine fetch) değişecek.
//
// NOT: Bu, mevcut prototipin src/mocks/products.ts + departments.ts (legacy
// Product/Department tipleri, src/types/index.ts) dosyalarından FARKLI bir
// veri kümesidir — offline motor (E3) tam sözleşmeye göre yazıldı, ekranlar
// henüz legacy tiplerde (bkz. domain/request/legacyAdapter.ts'teki aynı
// bilinçli ayrım). İkisi ileride tek katalogda birleşecek.

import type { Department, Location, Part } from '../contracts/types';

export const mockCatalogVersion = '2026-08-14T00:00:00Z';

export const mockCatalogDepartments: Department[] = [
  { id: 'd-montaj-1', code: 'MONTAJ-1', name: 'Montaj Hattı 1', type: 'PRODUCTION' },
  { id: 'd-ara-ambar', code: 'ARA-AMBAR', name: 'Ara Ambar', type: 'WAREHOUSE' },
  { id: 'd-kaynak-2', code: 'KAYNAK-2', name: 'Kaynak Hattı 2', type: 'PRODUCTION' },
];

export const mockCatalogLocations: Location[] = [
  { id: 'l-a-12-03', departmentId: 'd-ara-ambar', code: 'A-12-03', kind: 'SHELF' },
  { id: 'l-montaj1-drop-a', departmentId: 'd-montaj-1', code: 'DROP-A', kind: 'DROP_POINT' },
];

export const mockCatalogParts: Part[] = [
  {
    id: 'p-88213',
    partNo: '88213-A2',
    revision: 'A',
    descriptionTr: 'M8x40 Paslanmaz Cıvata',
    uom: 'ADET',
    serialTracked: false,
    lotTracked: false,
    minStock: 200,
    defaultSupplierDeptId: 'd-ara-ambar',
    barcodes: [
      { id: 'b-88213-1', partId: 'p-88213', symbology: 'CODE128', rawValue: '88213A2', isPrimary: true },
    ],
  },
  {
    id: 'p-90117',
    partNo: '90117',
    revision: 'B',
    descriptionTr: 'Conta Seti Smartline H',
    uom: 'SET',
    serialTracked: false,
    lotTracked: true,
    minStock: 20,
    defaultSupplierDeptId: 'd-ara-ambar',
    barcodes: [
      { id: 'b-90117-1', partId: 'p-90117', symbology: 'QR', rawValue: '90117', isPrimary: true },
    ],
  },
];
