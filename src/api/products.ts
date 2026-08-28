// src/api/products.ts
//
// Departman seçim ekranı kaldırıldı (2026-08-26) — artık ürün önce seçiliyor
// (QR okutarak ya da arayarak), departman bilgisi ürünün kendi departmentId
// alanından geliyor. getProductsByDepartment() yerine tüm ürünleri dönen
// getAllProducts() kullanılıyor.

import { Q } from '@nozbe/watermelondb';
import { Product } from '../types';
import { database } from '../infrastructure/db';
import PartModel from '../infrastructure/db/models/Part';
import PartBarcodeModel from '../infrastructure/db/models/PartBarcode';
import { mepsanServerClient } from '../infrastructure/mepsanServer/instance';
import { mapServerPartToProduct } from '../infrastructure/mepsanServer/mappers';

async function mapLocalPartToProduct(part: PartModel): Promise<Product> {
  const barcodesCol = database.get<PartBarcodeModel>('part_barcodes');
  const barcodes = await barcodesCol.query(Q.where('part_id', part.id)).fetch();
  const primary = barcodes.find((b) => b.isPrimary) ?? barcodes[0];

  return {
    id: part.id,
    name: part.descriptionTr,
    qrCode: primary?.rawValue ?? '',
    departmentId: part.defaultSupplierDeptId ?? '',
  };
}

async function upsertProductsLocally(products: Product[]): Promise<void> {
  if (!products.length) return;

  const partsCol = database.get<PartModel>('parts');
  const barcodesCol = database.get<PartBarcodeModel>('part_barcodes');

  await database.write(async () => {
    for (const product of products) {
      if (!product.id) continue;

      const existingPart = await partsCol.find(product.id).catch(() => null);
      if (existingPart) {
        await existingPart.update((row) => {
          row.descriptionTr = product.name;
          row.defaultSupplierDeptId = product.departmentId;
        });
      } else {
        await partsCol.create((row) => {
          row._raw.id = product.id;
          row.partNo = product.id;
          row.revision = 'A';
          row.descriptionTr = product.name;
          row.uom = 'ADET';
          row.serialTracked = false;
          row.lotTracked = false;
          row.minStock = 0;
          row.defaultSupplierDeptId = product.departmentId;
          row.attributes = {};
        });
      }

      if (product.qrCode) {
        const existingBarcodes = await barcodesCol.query(Q.where('part_id', product.id)).fetch();
        const alreadyHasThisCode = existingBarcodes.some((b) => b.rawValue === product.qrCode);
        if (!alreadyHasThisCode) {
          await barcodesCol.create((row) => {
            row.partId = product.id;
            row.symbology = 'CODE128';
            row.rawValue = product.qrCode;
            row.isPrimary = existingBarcodes.length === 0;
          });
        }
      }
    }
  });
}

export async function getProductByQrCode(qrCode: string): Promise<Product | undefined> {
  try {
    const response = await mepsanServerClient.send('PROCESS_QR', { qr_code: qrCode });
    if (response.status === 'ok' && response.item_info) {
      const info = response.item_info as Record<string, unknown>;
      if (info.found) {
        return {
          id: qrCode,
          name: String(info.name ?? ''),
          qrCode,
          departmentId: '',
        };
      }
    }
  } catch {
    // sunucuya ulaşılamadı — aşağıda yerel kataloğa düşülüyor
  }

  const barcodesCol = database.get<PartBarcodeModel>('part_barcodes');
  const matches = await barcodesCol.query(Q.where('raw_value', qrCode)).fetch();
  if (!matches.length) return undefined;
  const partsCol = database.get<PartModel>('parts');
  const part = await partsCol.find(matches[0].partId).catch(() => null);
  if (!part) return undefined;
  return mapLocalPartToProduct(part);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  try {
    const response = await mepsanServerClient.send('GET_PARTS', { department: '' });
    if (response.status !== 'ok') throw new Error(response.message ?? 'GET_PARTS başarısız');
    const data = Array.isArray(response.data) ? response.data : [];
    const mapped = data.map((raw) => mapServerPartToProduct(raw as Record<string, unknown>));
    void upsertProductsLocally(mapped);
    return mapped.filter((p) => ids.includes(p.id));
  } catch {
    const partsCol = database.get<PartModel>('parts');
    const parts = await partsCol.query(Q.where('id', Q.oneOf(ids))).fetch();
    return Promise.all(parts.map(mapLocalPartToProduct));
  }
}

/** Departman filtresi olmadan TÜM ürünleri döner — manuel arama ekranı için. */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await mepsanServerClient.send('GET_PARTS', { department: '' });
    if (response.status !== 'ok') throw new Error(response.message ?? 'GET_PARTS başarısız');
    const data = Array.isArray(response.data) ? response.data : [];
    const mapped = data.map((raw) => mapServerPartToProduct(raw as Record<string, unknown>));
    void upsertProductsLocally(mapped);
    return mapped;
  } catch {
    const partsCol = database.get<PartModel>('parts');
    const parts = await partsCol.query().fetch();
    return Promise.all(parts.map(mapLocalPartToProduct));
  }
}