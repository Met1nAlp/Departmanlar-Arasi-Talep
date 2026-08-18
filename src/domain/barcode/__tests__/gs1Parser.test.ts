import { describe, expect, it } from '@jest/globals';
import { parseGs1Barcode, normalizeGs1Date } from '../gs1Parser';

describe('parseGs1Barcode', () => {
  it('düz QR/EAN kodlarında null döner (GS1 AI ile başlamıyorsa)', () => {
    expect(parseGs1Barcode('MTS-REQ-0042')).toBeNull();
    expect(parseGs1Barcode('8690123456789')).toBeNull();
  });

  it('boş girişte null döner', () => {
    expect(parseGs1Barcode('')).toBeNull();
  });

  it('sabit uzunluklu GTIN (01) alanını doğru ayrıştırır', () => {
    const result = parseGs1Barcode('0112345678901231');
    expect(result).not.toBeNull();
    expect(result!.gtin).toBe('12345678901231');
  });

  it('değişken uzunluklu lot (10) + GS ayraçlı sonraki AI (21)', () => {
    const raw = '0112345678901231' + '10LOT77' + '\x1d' + '21SN00042';
    const result = parseGs1Barcode(raw)!;
    expect(result.gtin).toBe('12345678901231');
    expect(result.lot).toBe('LOT77');
    expect(result.serial).toBe('SN00042');
  });

  it('SKT (17, sabit 6 hane YYMMDD) ayrıştırılır', () => {
    const raw = '0112345678901231' + '17260831';
    const result = parseGs1Barcode(raw)!;
    expect(result.expiryDate).toBe('260831');
  });

  it('GS olmadan barkod sonuna kadar giden değişken alanı okur', () => {
    const result = parseGs1Barcode('10LOT-A99')!;
    expect(result.lot).toBe('LOT-A99');
  });

  it('kapsam dışı/tanınmayan AI çıkarsa ayrıştırmayı orada durdurur, mevcut alanları korur', () => {
    const raw = '0112345678901231' + '99UNKNOWNVALUE';
    const result = parseGs1Barcode(raw)!;
    expect(result.gtin).toBe('12345678901231');
    expect(result.extra).toEqual({});
  });
});

describe('normalizeGs1Date', () => {
  it('YYMMDD formatını Date nesnesine çevirir', () => {
    const date = normalizeGs1Date('260831');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(7); // 0-indexed → Ağustos
    expect(date!.getDate()).toBe(31);
  });

  it('undefined veya hatalı uzunlukta null döner', () => {
    expect(normalizeGs1Date(undefined)).toBeNull();
    expect(normalizeGs1Date('2608')).toBeNull();
  });

  it('geçersiz ay/gün değerlerinde null döner', () => {
    expect(normalizeGs1Date('261399')).toBeNull();
  });
});
