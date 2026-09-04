// src/store/deviceStore.ts
//
// NFC modeline geçişle birlikte "kayıt kodu" akışı KALDIRILDI. Cihaz kimliği
// (deviceUid) hâlâ kalıcı olarak üretilip saklanıyor — MepsanServerClient'in
// her mesajda serial_number olarak gönderdiği kimlik bu. Yetkilendirme
// artık burada değil, doğrudan mepsanServerClient.authenticate() ile,
// uygulama açılışında otomatik yapılıyor (bkz. mepsanServer/instance.ts).
//
// OTOMATİK CİHAZ KİMLİĞİ (2026-09-08): Gerçek fabrika seri numarası işletim
// sistemi kısıtı yüzünden okunamıyor (Android 8+ / iOS, MDM olmadan mümkün
// değil — doğrulandı). Bunun yerine hydrate() artık OS'un otomatik verdiği
// kalıcı cihaz kimliğini (Android ID / iOS identifierForVendor — bkz.
// infrastructure/device/deviceIdentifier.ts) kendiliğinden okuyup kaydediyor;
// kullanıcı Ayarlar'a hiç yönlendirilmiyor. setSerialNumber/clearSerialNumber
// SADECE otomatik okuma başarısız olursa (örn. web, ya da native modül henüz
// derlenmemiş bir build) DeviceUnauthorizedScreen'deki elle-giriş formunda
// YEDEK olarak kullanılmaya devam ediyor.

import { create } from 'zustand';
import { getSecureItem, setSecureItem, SECURE_STORAGE_KEYS } from '../infrastructure/security/secureStorage';
import { getAutoDeviceId } from '../infrastructure/device/deviceIdentifier';

interface DeviceState {
  deviceUid: string | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  /**
   * Otomatik okuma başarısız olursa (bkz. dosya başı notu) kullanılan YEDEK
   * elle-giriş yolu. Barış'ın veritabanı BÜYÜK HARF bekliyor — kullanıcı
   * küçük de yazsa burada otomatik büyük harfe çevriliyor.
   */
  setSerialNumber: (serialNumber: string) => Promise<void>;
  clearSerialNumber: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceUid: null,
  isLoading: true,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const stored = await getSecureItem(SECURE_STORAGE_KEYS.deviceUid);
      if (stored) {
        console.log('[DEVICE] kayıtlı cihaz kimliği bulundu:', stored);
        set({ deviceUid: stored, isLoading: false });
        return;
      }

      console.log('[DEVICE] kayıtlı kimlik yok, otomatik okunuyor...');
      const autoId = await getAutoDeviceId();
      if (autoId) {
        console.log('[DEVICE] otomatik cihaz kimliği alındı:', autoId);
        await setSecureItem(SECURE_STORAGE_KEYS.deviceUid, autoId);
        set({ deviceUid: autoId, isLoading: false });
        return;
      }

      // Otomatik okuma bu platformda mümkün değil (örn. web) — kullanıcı
      // DeviceUnauthorizedScreen'deki yedek forma düşer.
      console.log('[DEVICE] otomatik kimlik alınamadı, elle girişe düşülüyor');
      set({ deviceUid: null, isLoading: false });
    } catch (error) {
      console.log('[DEVICE] hydrate hatası:', error instanceof Error ? error.message : error);
      set({ isLoading: false });
    }
  },

  setSerialNumber: async (serialNumber: string) => {
    const normalized = serialNumber.trim().toUpperCase();
    await setSecureItem(SECURE_STORAGE_KEYS.deviceUid, normalized);
    set({ deviceUid: normalized });
  },

  clearSerialNumber: async () => {
    await setSecureItem(SECURE_STORAGE_KEYS.deviceUid, '');
    set({ deviceUid: null });
  },
}));