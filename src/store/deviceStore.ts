// src/store/deviceStore.ts
//
// NFC modeline geçişle birlikte "kayıt kodu" akışı KALDIRILDI. Cihaz kimliği
// (deviceUid) hâlâ kalıcı olarak üretilip saklanıyor — MepsanServerClient'in
// her mesajda serial_number olarak gönderdiği kimlik bu. Yetkilendirme
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
   * Kullanıcının Ayarlar'dan bulup elle girdiği cihaz SERİ NUMARASI. Uygulama
   * seri numarasını işletim sistemi kısıtı yüzünden otomatik okuyamıyor — bu
   * yüzden bir kereliğine elle giriliyor, kalıcı saklanıyor. Barış'ın
   * veritabanı BÜYÜK HARF bekliyor — kullanıcı küçük de yazsa burada otomatik
   * büyük harfe çevriliyor, format hatası riski kullanıcıya bırakılmıyor.
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
      const deviceUid = await getSecureItem(SECURE_STORAGE_KEYS.deviceUid);
      set({ deviceUid, isLoading: false }); // null olabilir — seri numarası henüz girilmemiş demektir
    } catch {
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