// src/api/products.ts
//
// Departman seçim ekranı kaldırıldı (2026-08-26) — artık ürün önce seçiliyor
// (QR okutarak ya da arayarak), departman bilgisi ürünün kendi departmentId
// alanından geliyor.
//
// NOT (sonradan): Envanterde 7.000'i aşkın kalem olduğu için TÜM ürünleri
// tek seferde çeken getAllProducts() KALDIRILDI — ProductSearchScreen artık
// kullanıcı tam kodu girince getProductByQrCode() ile tekil arama yapıyor.

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
    // GEÇİCİ TEŞHİS LOGU — PROCESS_QR cevabında departman bilgisi var mı yok mu
    // netleştirmek için (sorun bulununca kaldırılacak).
    console.log('[PROCESS_QR] cevap:', JSON.stringify(response).slice(0, 500));
    if (response.status === 'ok' && response.item_info) {
      const info = response.item_info as Record<string, unknown>;
      if (info.found) {
        // PROCESS_QR departman bilgisini bazı sunucu sürümlerinde vermiyor —
        // varsa (department/department_id) onu kullan, yoksa yerel katalogda
        // (daha önce GET_PARTS'tan senkronize edilmiş) bu QR koda ait bir
        // kayıt var mı diye bakıp oradan tamamlamayı dene.
        let departmentId = String(info.department ?? info.department_id ?? '');
        if (!departmentId) {
          const localMatch = await findLocalProductByQrCode(qrCode);
          departmentId = localMatch?.departmentId ?? '';
        }
        const product: Product = { id: qrCode, name: String(info.name ?? ''), qrCode, departmentId };
        // Tekil sonuçları da yerel kataloğa yazıyoruz — böylece bu ürün bir
        // dahaki sefere (offline dahil) findLocalProductByQrCode'dan bulunur.
        void upsertProductsLocally([product]);
        return product;
      }
    }
  } catch {
    // sunucuya ulaşılamadı — aşağıda yerel kataloğa düşülüyor
  }

  return findLocalProductByQrCode(qrCode);
}

async function findLocalProductByQrCode(qrCode: string): Promise<Product | undefined> {
  const barcodesCol = database.get<PartBarcodeModel>('part_barcodes');
  const matches = await barcodesCol.query(Q.where('raw_value', qrCode)).fetch();
  if (!matches.length) return undefined;
  const partsCol = database.get<PartModel>('parts');
  const part = await partsCol.find(matches[0].partId).catch(() => null);
  if (!part) return undefined;
  return mapLocalPartToProduct(part);
}

/**
 * Birden fazla ürünü isimleriyle çözmek için kullanılır (talep listelerinde
 * ürün adı gösterme). ESKİDEN GET_PARTS'ı filtresiz (department: '') çağırıp
 * TÜM envanteri (7.000+ kalem) çekip yerelde filtreliyordu — bu, envanter
 * optimizasyonu için düzelttiğimiz TAM O SORUNDU (zaman aşımı / performans).
 * Artık her id için ayrı ayrı, tekil PROCESS_QR araması (getProductByQrCode)
 * yapılıyor — ProductSearchScreen'deki aynı prensip.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (!uniqueIds.length) return [];
  const results = await Promise.all(uniqueIds.map((id) => getProductByQrCode(id)));
  return results.filter((p): p is Product => !!p);
}

