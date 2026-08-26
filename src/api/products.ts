// src/api/products.ts
//
// GET_PARTS komutu Barış'ın sunucusunda hazır (2026-08-22). Diğer offline-first
// API'lerle (requests.ts) aynı desen: önce gerçek sunucuya sor, ulaşılamazsa
// WatermelonDB'deki yerel katalog önbelleğine düş.
//
// GÜNCELLEME: Sunucudan başarılı bir GET_PARTS cevabı geldiğinde, ürünler
// artık yerel `parts`/`part_barcodes` tablolarına da UPSERT ediliyor (varsa
// güncellenir, yoksa oluşturulur). Böylece internet kesildiğinde gösterilen
// "yerel yedek" artık mocks/catalog.ts'teki sahte veri değil, en son
// sunucudan görülen GERÇEK ürünler oluyor.

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

/**
 * Sunucudan gelen ürünleri yerel kataloğa yazar (upsert). Product.id şu an
 * qrCode ile aynı (sunucu ayrı bir id alanı göndermiyor, bkz. mappers.ts).
 * Part.id'yi de aynı değerle sabitliyoruz ki getProductByQrCode'daki
 * part_barcodes eşlemesi çalışmaya devam etsin.
 */
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

// Backend sözleşmesi: GET_PARTS { department: "" } — id listesiyle sorgu
// desteklenmiyor, bu yüzden tüm ürünleri çekip id'ye göre client tarafında
// filtreliyoruz (GET_REQUESTS'teki "boş filtre = tümü" mantığıyla tutarlı).
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

export async function getProductsByDepartment(departmentId: string): Promise<Product[]> {
  try {
    const response = await mepsanServerClient.send('GET_PARTS', { department: departmentId });
    if (response.status !== 'ok') throw new Error(response.message ?? 'GET_PARTS başarısız');
    const data = Array.isArray(response.data) ? response.data : [];
    const mapped = data.map((raw) => mapServerPartToProduct(raw as Record<string, unknown>));
    const filtered = mapped.filter((p) => p.departmentId === departmentId);
    void upsertProductsLocally(filtered);
    return filtered;
  } catch {
    const partsCol = database.get<PartModel>('parts');
    const parts = await partsCol.query(Q.where('default_supplier_dept_id', departmentId)).fetch();
    return Promise.all(parts.map(mapLocalPartToProduct));
  }
}