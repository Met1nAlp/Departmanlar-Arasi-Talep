// src/store/deviceStore.ts
//
// Plan Bölüm 14.2 adım 1 "Cihaz kaydı (bir kez, kurulumda)". authStore'dan
// AYRI tutulur çünkü ömrü farklıdır: yetkili/personel oturumları vardiya
// bazlı kapanıp açılır, cihaz kaydı ise BT cihazı sıfırlayana kadar kalıcıdır
// (bkz. secureStorage.ts'teki clearAuthSecureStorage / clearDeviceSecureStorage
// ayrımı — yetkili çıkışı asla cihaz kaydını silmez).

import { create } from 'zustand';
import { enrollDevice, AuthError } from '../api/auth';
import {
  getSecureItem,
  setSecureItem,
  SECURE_STORAGE_KEYS,
} from '../infrastructure/security/secureStorage';
import type { Device } from '../contracts/types';

interface DeviceState {
  deviceUid: string | null;
  deviceToken: string | null;
  departmentId: string | null;
  mode: Device['mode'] | null;
  isLoading: boolean;
  enrollError: string | null;

  hydrate: () => Promise<void>;
  enroll: (enrollCode: string) => Promise<void>;
  clearEnrollError: () => void;
}

function generateDeviceUid(): string {
  // MOCK — gerçek cihazda expo-device (Device.osInternalBuildId vb.) veya
  // donanım kimliği kullanılabilir. Burada tek seferlik, kalıcı rastgele bir
  // kimlik üretip SecureStore'a yazmak yeterli (Plan Bölüm 10.1 DEVICE.device_uid).
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  deviceUid: null,
  deviceToken: null,
  departmentId: null,
  mode: null,
  isLoading: true,
  enrollError: null,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const [deviceUid, deviceToken, departmentId, mode] = await Promise.all([
        getSecureItem(SECURE_STORAGE_KEYS.deviceUid),
        getSecureItem(SECURE_STORAGE_KEYS.deviceToken),
        getSecureItem(SECURE_STORAGE_KEYS.deviceDepartmentId),
        getSecureItem(SECURE_STORAGE_KEYS.deviceMode),
      ]);
      set({
        deviceUid,
        deviceToken,
        departmentId,
        mode: mode as Device['mode'] | null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  enroll: async (enrollCode: string) => {
    set({ enrollError: null });
    try {
      const deviceUid = get().deviceUid ?? generateDeviceUid();
      const result = await enrollDevice(deviceUid, enrollCode);
      await Promise.all([
        setSecureItem(SECURE_STORAGE_KEYS.deviceUid, deviceUid),
        setSecureItem(SECURE_STORAGE_KEYS.deviceToken, result.deviceToken),
        setSecureItem(SECURE_STORAGE_KEYS.deviceDepartmentId, result.departmentId),
        setSecureItem(SECURE_STORAGE_KEYS.deviceMode, result.mode),
      ]);
      set({
        deviceUid,
        deviceToken: result.deviceToken,
        departmentId: result.departmentId,
        mode: result.mode,
      });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Cihaz kaydı başarısız. Tekrar deneyin.';
      set({ enrollError: message });
      throw err;
    }
  },

  clearEnrollError: () => set({ enrollError: null }),
}));

export function useIsDeviceEnrolled(): boolean {
  return useDeviceStore((s) => s.deviceToken !== null);
}
