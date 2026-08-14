// src/store/authStore.ts
//
// Plan Bölüm 14.2 "İki katmanlı model":
//   1) Yetkili (supervisor) kullanıcı adı/şifre ile giriş yapar → `supervisor`
//   2) O yetkilinin gözetimindeki personel PIN ile oturum açar → `activeSession`
// Ekranlara giden rol/RBAC kararları HER ZAMAN `activeSession.user`dan alınır,
// `supervisor`dan değil — çünkü fiziksel eylemi yapan kişi personeldir, amir
// yalnızca cihazın "gözetim altında" olduğunu garanti eder.
//
// Token'lar (accessToken/refreshToken) expo-secure-store'da tutulur; bu store
// yalnızca bellekteki kopyayı taşır. Uygulama açılışında `hydrate()` SecureStore'u
// okuyup token süresi dolmamışsa supervisor oturumunu geri yükler.

import { create } from 'zustand';
import { User } from '../types';
import {
  loginWithCredentials,
  startPinSession,
  endSession,
  refreshAccessToken,
  AuthError,
  type SessionEndReason,
} from '../api/auth';
import {
  getSecureItem,
  setSecureItem,
  deleteSecureItem,
  clearAuthSecureStorage,
  SECURE_STORAGE_KEYS,
} from '../infrastructure/security/secureStorage';
import { isExpired } from '../infrastructure/security/tokenService';

interface ActiveSession {
  sessionId: string;
  user: User;
}

interface AuthState {
  supervisor: User | null;
  activeSession: ActiveSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  isLoading: boolean;
  authError: string | null;

  hydrate: () => Promise<void>;
  loginSupervisor: (username: string, password: string) => Promise<void>;
  logoutSupervisor: () => Promise<void>;
  startStaffSession: (memberUserId: string, pin: string) => Promise<void>;
  endStaffSession: (reason: SessionEndReason) => Promise<void>;
  ensureFreshAccessToken: () => Promise<string | null>;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  supervisor: null,
  activeSession: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  isLoading: true,
  authError: null,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken, expiresAtRaw, supervisorRaw] = await Promise.all([
        getSecureItem(SECURE_STORAGE_KEYS.accessToken),
        getSecureItem(SECURE_STORAGE_KEYS.refreshToken),
        getSecureItem(SECURE_STORAGE_KEYS.tokenExpiresAt),
        getSecureItem(SECURE_STORAGE_KEYS.supervisorUser),
      ]);

      if (!accessToken || !refreshToken || !supervisorRaw) {
        set({ isLoading: false });
        return;
      }
      // Refresh token da süresi dolmuşsa (12 sa — vardiya bitmiş) baştan giriş istenir.
      if (isExpired(refreshToken)) {
        await clearAuthSecureStorage();
        set({ isLoading: false });
        return;
      }

      const supervisor = JSON.parse(supervisorRaw) as User;
      set({
        supervisor,
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expiresAtRaw ? Number(expiresAtRaw) : null,
        isLoading: false,
      });
      // Personel PIN oturumu SecureStore'da SAKLANMAZ (Plan Bölüm 12.4 çevrimdışı
      // kuralları: oturum bilgisi hassas, cihaz her yeniden açılışta personel
      // tekrar PIN girer). Bu yüzden hydrate sonrası activeSession hep null'dır.
    } catch {
      set({ isLoading: false });
    }
  },

  loginSupervisor: async (username, password) => {
    set({ authError: null });
    try {
      const result = await loginWithCredentials(username, password);
      await Promise.all([
        setSecureItem(SECURE_STORAGE_KEYS.accessToken, result.accessToken),
        setSecureItem(SECURE_STORAGE_KEYS.refreshToken, result.refreshToken),
        setSecureItem(SECURE_STORAGE_KEYS.tokenExpiresAt, String(result.accessTokenExpiresAt)),
        setSecureItem(SECURE_STORAGE_KEYS.supervisorUser, JSON.stringify(result.supervisorUser)),
      ]);
      set({
        supervisor: result.supervisorUser,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Giriş yapılamadı. Tekrar deneyin.';
      set({ authError: message });
      throw err;
    }
  },

  logoutSupervisor: async () => {
    await clearAuthSecureStorage();
    set({
      supervisor: null,
      activeSession: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
    });
  },

  startStaffSession: async (memberUserId, pin) => {
    set({ authError: null });
    try {
      const result = await startPinSession(memberUserId, pin);
      set({ activeSession: { sessionId: result.sessionId, user: result.memberUser } });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Oturum açılamadı. Tekrar deneyin.';
      set({ authError: message });
      throw err;
    }
  },

  endStaffSession: async (reason) => {
    const session = get().activeSession;
    if (session) {
      await endSession(session.sessionId, reason);
    }
    set({ activeSession: null });
  },

  ensureFreshAccessToken: async () => {
    const { accessToken, refreshToken, supervisor } = get();
    if (!accessToken || !refreshToken || !supervisor) return null;
    if (!isExpired(accessToken)) return accessToken;
    if (isExpired(refreshToken)) {
      // Refresh token da bitmiş — tam çıkış gerekir (Plan Bölüm 14.3).
      await get().logoutSupervisor();
      return null;
    }
    const refreshed = await refreshAccessToken(refreshToken, supervisor.id, supervisor.role);
    await Promise.all([
      setSecureItem(SECURE_STORAGE_KEYS.accessToken, refreshed.accessToken),
      setSecureItem(SECURE_STORAGE_KEYS.tokenExpiresAt, String(refreshed.accessTokenExpiresAt)),
    ]);
    set({ accessToken: refreshed.accessToken, accessTokenExpiresAt: refreshed.accessTokenExpiresAt });
    return refreshed.accessToken;
  },

  clearAuthError: () => set({ authError: null }),
}));

/**
 * Ekranların RBAC/kişiselleştirme için ihtiyaç duyduğu "şu an cihazı kullanan kişi".
 * Eski `useAuthStore((s) => s.user)` çağrılarının yerini alır — kaynağı artık
 * `activeSession` (PIN ile oturum açmış personel), `supervisor` değil.
 */
export function useActiveUser(): User | null {
  return useAuthStore((s) => s.activeSession?.user ?? null);
}
