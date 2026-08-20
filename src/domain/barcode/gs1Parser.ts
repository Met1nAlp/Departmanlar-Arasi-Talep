// src/domain/barcode/gs1Parser.ts
//
// Plan Bölüm 13.3 "Barkod çözümleme akışı": tedarikçi/üretici tarafından
// basılan GS1-128 / GS1 DataMatrix barkodları (Application Identifier, "AI"
// öneki taşıyan) çözümlenir. Kendi ürettiğimiz düz QR kodlar (yalnızca ürün
// kimliği) ve fabrika EAN/UPC barkodları bu parser'a hiç girmez — onlar
// api/products.ts'teki mevcut getProductByQrCode akışında kalır (bkz.
// screens/saha-personeli/QRScanScreen.tsx: parseGs1Barcode önce denenir,
// null dönerse eski davranışa düşülür).
//
// Referans: GS1 General Specifications — desteklenen AI'lar bu projenin
// kapsamı için yeterli olan bir alt kümedir (GTIN, lot/parti, seri no, SKT,
// üretim tarihi, miktar). Kapsam dışı AI'lar `extra` alanına ham olarak yazılır.

/** FNC1 (GS, ASCII 0x1D) — değişken uzunluklu bir AI'ın bittiğini işaretler.
 * Tarayıcılar bunu genelde '' olarak veya bazı Expo/Android
 * sürümlerinde '~' ile iletir; ikisini de destekliyoruz. */
const GS_SEPARATORS = ['', '~'];

/** AI kodu → { alan adı, sabit uzunluk (varsa) }. Sabit uzunluğu olmayanlar
 * GS ile veya barkodun sonuyla sınırlanır. */
const AI_DEFINITIONS: Record<string, { field: keyof ParsedGs1Fields; fixedLength?: number }> = {
  '01': { field: 'gtin', fixedLength: 14 },
  '10': { field: 'lot' },
  '17': { field: 'expiryDate', fixedLength: 6 },
  '11': { field: 'productionDate', fixedLength: 6 },
  '21': { field: 'serial' },
  '30': { field: 'quantity' },
  '37': { field: 'quantity' },
  '240': { field: 'additionalId' },
};

export interface ParsedGs1Fields {
  gtin?: string;
  lot?: string;
  serial?: string;
  expiryDate?: string; // YYMMDD, ham — normalizeGs1Date ile Date'e çevrilir
  productionDate?: string; // YYMMDD, ham
  quantity?: string;
  additionalId?: string;
}

export interface ParsedGs1Barcode extends ParsedGs1Fields {
  raw: string;
  /** Tanınmayan/kapsam dışı AI kodları, ham değerleriyle (kayıp veri olmasın diye). */
  extra: Record<string, string>;
}

/**
 * `raw` bir GS1 barkoduna benziyorsa (bilinen bir AI ile başlıyorsa)
 * ayrıştırılmış alanları döner; değilse `null` döner — çağıran taraf bu
 * durumda barkodu düz QR/EAN olarak ele almalı.
 */
export function parseGs1Barcode(raw: string): ParsedGs1Barcode | null {
  if (!raw || !looksLikeGs1(raw)) {
    return null;
  }

  const result: ParsedGs1Barcode = { raw, extra: {} };
  let cursor = 0;

  while (cursor < raw.length) {
    const ai = matchAiAt(raw, cursor);
    if (!ai) {
      // Tanınmayan bir AI ile karşılaşıldı — güvenli tarafta kal, kalanı ayrıştırmayı bırak.
      break;
    }
    cursor += ai.code.length;

    const def = AI_DEFINITIONS[ai.code];
    let value: string;

    if (def?.fixedLength) {
      value = raw.slice(cursor, cursor + def.fixedLength);
      cursor += def.fixedLength;
    } else {
      const gsIndex = findNextGs(raw, cursor);
      const end = gsIndex === -1 ? raw.length : gsIndex;
      value = raw.slice(cursor, end);
      cursor = gsIndex === -1 ? raw.length : gsIndex + 1;
    }

    if (def) {
      (result[def.field] as string | undefined) = value;
    } else {
      result.extra[ai.code] = value;
    }
  }

  return result;
}

function looksLikeGs1(raw: string): boolean {
  return matchAiAt(raw, 0) !== null;
}

function matchAiAt(raw: string, index: number): { code: string } | null {
  // AI kodları 2, 3 veya 4 hane olabilir; burada projede kullanılanları (2-3 hane) kontrol ediyoruz.
  for (const len of [3, 2]) {
    const candidate = raw.slice(index, index + len);
    if (candidate.length === len && candidate in AI_DEFINITIONS) {
      return { code: candidate };
    }
  }
  return null;
}

function findNextGs(raw: string, from: number): number {
  let earliest = -1;
  for (const sep of GS_SEPARATORS) {
    const idx = raw.indexOf(sep, from);
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx;
    }
  }
  return earliest;
}

/** GS1'in YYMMDD tarih formatını Date'e çevirir. 2000-2099 aralığı varsayılır
 * (Plan kapsamındaki kullanım ömrü için yeterli). Geçersiz girişte null döner. */
export function normalizeGs1Date(yymmdd: string | undefined): Date | null {
  if (!yymmdd || yymmdd.length !== 6) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd)) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(2000 + yy, mm - 1, dd);
  return Number.isNaN(date.getTime()) ? null : date;
}
