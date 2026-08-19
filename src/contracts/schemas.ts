// src/contracts/schemas.ts
//
// types.ts içindeki tiplerin çalışma zamanı doğrulaması için Zod şemaları.
// Aynı şema hem form doğrulamasında (React Hook Form + zodResolver) hem de
// API/WS'den gelen verinin doğrulanmasında kullanılır — plan Bölüm 12.1.
//
// KURAL: Şema burada değişirse types.ts'deki karşılığı da güncellenmeli.
// İkisi elle senkron tutulur (zod'dan tip türetmek yerine tipleri ayrı tutuyoruz
// çünkü types.ts hiçbir paket import etmemeli — "saf sözleşme" kuralı).

import { z } from 'zod';
import {
  ROLES,
  REQUEST_STATES,
  PRIORITIES,
} from './types';

export const roleSchema = z.enum(ROLES as [string, ...string[]]);

export const requestStateSchema = z.enum(REQUEST_STATES as [string, ...string[]]);

export const prioritySchema = z.enum(PRIORITIES as [string, ...string[]]);

export const barcodeSymbologySchema = z.enum(['DATAMATRIX', 'CODE128', 'QR', 'EAN13']);

export const partBarcodeSchema = z.object({
  id: z.string(),
  partId: z.string(),
  symbology: barcodeSymbologySchema,
  rawValue: z.string().min(1),
  parsedGtin: z.string().optional(),
  isPrimary: z.boolean(),
});

export const partSchema = z.object({
  id: z.string(),
  partNo: z.string().min(1),
  revision: z.string(),
  descriptionTr: z.string().min(1),
  descriptionEn: z.string().optional(),
  uom: z.enum(['ADET', 'KG', 'MT', 'SET']),
  serialTracked: z.boolean(),
  lotTracked: z.boolean(),
  minStock: z.number().nonnegative(),
  defaultSupplierDeptId: z.string().optional(),
  barcodes: z.array(partBarcodeSchema),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const requestLineSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  partId: z.string(),
  qtyRequested: z.number().positive('Adet 0\'dan büyük olmalı'),
  qtyPrepared: z.number().nonnegative().optional(),
  qtyDelivered: z.number().nonnegative().optional(),
  shortageReason: z.string().optional(),
  containerTypeId: z.string().optional(),
});

/**
 * "Yeni çağrı" formunun doğrulama şeması. Sunucuya gitmeden önce, offline'da bile
 * çalışır (React Hook Form + zodResolver). Plan Bölüm 3.3: çağrı oluşturma < 20 sn
 * hedefi olduğu için doğrulama sade tutulmalı.
 */
export const createRequestInputSchema = z.object({
  requesterDeptId: z.string().min(1, 'Talep eden bölüm seçilmeli'),
  supplierDeptId: z.string().min(1, 'Tedarikçi bölüm seçilmeli'),
  priority: prioritySchema,
  deliveryLocationId: z.string().optional(),
  lines: z
    .array(
      z.object({
        partId: z.string().min(1, 'Parça seçilmeli'),
        qtyRequested: z.number().positive('Adet 0\'dan büyük olmalı'),
      })
    )
    .min(1, 'En az bir kalem gerekli'),
  note: z.string().max(500).optional(),
  clientRequestId: z.string().uuid(),
});

export type CreateRequestInput = z.infer<typeof createRequestInputSchema>;

export const materialRequestSchema = z.object({
  id: z.string(),
  requestNo: z.string(),
  requesterUserId: z.string(),
  requesterDeptId: z.string(),
  supplierDeptId: z.string(),
  state: requestStateSchema,
  priority: prioritySchema,
  deliveryLocationId: z.string().optional(),
  lines: z.array(requestLineSchema),
  createdAt: z.string(),
  slaDueAt: z.string().optional(),
  closedAt: z.string().optional(),
  clientRequestId: z.string(),
  note: z.string().optional(),
  transportOrderId: z.string().optional(),
});

/**
 * Tedarikçinin "hazırlandı" onayı — barkod doğrulaması + adet + varsa seri no.
 * Plan Bölüm 7.3 akışının son adımı.
 */
export const readyRequestInputSchema = z.object({
  requestId: z.string(),
  lines: z
    .array(
      z.object({
        requestLineId: z.string(),
        qtyPrepared: z.number().nonnegative(),
        shortageReason: z.string().optional(),
        serials: z.array(z.object({ serialNo: z.string().min(1), lotNo: z.string().optional() })).optional(),
      })
    )
    .min(1),
  containerTypeId: z.string().optional(),
});

export type ReadyRequestInput = z.infer<typeof readyRequestInputSchema>;

export const eventEnvelopeSchema = z.object({
  seq: z.number(),
  id: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  channel: z.string(),
  payload: z.unknown(),
});
