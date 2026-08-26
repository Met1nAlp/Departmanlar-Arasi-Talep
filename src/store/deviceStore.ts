// src/store/deviceStore.ts
//
// NFC modeline geçişle birlikte "kayıt kodu" akışı KALDIRILDI. Cihaz kimliği
// (deviceUid) hâlâ kalıcı olarak üretilip saklanıyor — MepsanServerClient'in
// AUTH_REQUEST'te mac_address yerine kullandığı geçici kimlik bu. Yetkilendirme
// artık burada değil, doğrudan mepsanServerClient.authenticate() ile,
// uygulama açılışında otomatik yapılıyor (bkz. mepsanServer/instance.ts).

import { create } from 'zustand';
import { getSecureItem, setSecureItem, SECURE_STORAGE_KEYS } from '../infrastructure/security/secureStorage';

function generateDeviceUid(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
interface DeviceState {
  deviceUid: string | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  /**
   * Kullanıcının Ayarlar'dan bulup elle girdiği GERÇEK MAC adresi. Uygulama
   * gerçek MAC'i işletim sistemi kısıtı yüzünden okuyamıyor (Android 6+/iOS
   * hepsi engelliyor) — bu yüzden bir kereliğine elle giriliyor, kalıcı
   * saklanıyor. Barış'ın veritabanı BÜYÜK HARF bekliyor — kullanıcı küçük
   * de yazsa burada otomatik büyük harfe çevriliyor, format hatası riski
   * kullanıcıya bırakılmıyor.
   */
  setMacAddress: (mac: string) => Promise<void>;
  clearMacAddress: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceUid: null,
  isLoading: true,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const deviceUid = await getSecureItem(SECURE_STORAGE_KEYS.deviceUid);
      set({ deviceUid, isLoading: false }); // null olabilir — MAC henüz girilmemiş demektir
    } catch {
      set({ isLoading: false });
    }
  },

  setMacAddress: async (mac: string) => {
    const normalized = mac.trim().toUpperCase();
    await setSecureItem(SECURE_STORAGE_KEYS.deviceUid, normalized);
    set({ deviceUid: normalized });
  },

  clearMacAddress: async () => {
    await setSecureItem(SECURE_STORAGE_KEYS.deviceUid, '');
    set({ deviceUid: null });
  },
}));