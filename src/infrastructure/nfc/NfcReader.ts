// src/infrastructure/nfc/NfcReader.ts
//
// NFC kart okuma sarmalayıcısı. Ekranlar react-native-nfc-manager'ı
// DOĞRUDAN kullanmaz, bu katmandan geçer — kütüphane değişirse (ya da
// simülatör/test için sahte bir implementasyon gerekirse) tek burası değişir.
//
// ÖNEMLİ KISIT: NFC donanımı simülatör/emülatörde ÇALIŞMAZ. Bu dosya sadece
// gerçek, fiziksel cihazda (dev-client build) anlamlı sonuç verir.

import NfcManager, { NfcTech, TagEvent } from 'react-native-nfc-manager';

let started = false;

async function ensureStarted(): Promise<void> {
  if (started) return;
  await NfcManager.start();
  started = true;
}

export async function isNfcSupported(): Promise<boolean> {
  try {
    return await NfcManager.isSupported();
  } catch (error) {
    // GEÇİCİ: gerçek hatayı görmek için — normalde sessizce false dönerdik.
    console.warn('[NFC] isSupported() hata verdi:', error);
    return false;
  }
}

/**
 * Kart okutulmasını bekler, kartın UID'sini (büyük harf, iki nokta üst üste
 * olmadan, örn. "04A224B2") döndürür. Kullanıcı kart okutmazsa/iptal ederse
 * çağıran taraf bu Promise'i AbortController ile veya ekran kapanınca
 * cancelReading() çağırarak iptal edebilir.
 */
export async function readCardUid(): Promise<string> {
  await ensureStarted();
  try {
    // NfcTech.Ndef değil NfcTech.NfcA/IsoDep vb. de gerekebilir — kartın
    // tipine göre. Şimdilik en yaygın senaryo (Ndef okuyabilen kartlar) için
    // Ndef ile başlıyoruz; test kartında farklı davranış görürsen (örn.
    // "tag is not Ndef formatted" hatası) bunu genişletmemiz gerekebilir.
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag: TagEvent | null = await NfcManager.getTag();
    if (!tag?.id) throw new Error('Kart okunamadı (UID boş)');
    return tag.id.toUpperCase();
  } finally {
    // Okuma başarılı da olsa hata da alsa, NFC oturumunu her zaman kapat.
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

/** Bekleyen bir readCardUid() çağrısını iptal eder (örn. ekran kapanırken). */
export function cancelReading(): void {
  NfcManager.cancelTechnologyRequest().catch(() => {});
}