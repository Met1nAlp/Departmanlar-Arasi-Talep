// src/store/authStore.ts
//
// NFC OTURUM MODELİ (eski iki katmanlı supervisor+PIN modelinin yerine):
// Kullanıcı, kartını okutur -> sunucuya CARD_LOGIN gönderilir -> dönen
// kullanıcı doğrudan currentUser olur. Cihaz kaydı (deviceStore) tamamen
// ayrı bir kavram olarak kalmaya devam ediyor — o, CİHAZIN sunucuya
// bağlanabilmesiyle ilgili, kullanıcı kimliğiyle ilgili değil.
//
// Token/SecureStore mekanizması KALDIRILDI — NFC modelinde "oturumu SecureStore'da
// sakla, açılışta geri yükle" mantığına gerek yok, çünkü her açılışta zaten
// yeniden kart okutuluyor (kalıcı oturum tutmuyoruz, PDF'in "her girişte kart
// okut" kuralına bilinçli uyum).

import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  authError: string | null;

  loginWithCardUser: (user: User) => void;
  logout: () => void;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  // NFC modelinde SecureStore'dan geri yükleme yok — isLoading hep false,
  // RootNavigator ekstra bir "hydrate bitene kadar bekle" adımına gerek duymuyor.
  isLoading: false,
  authError: null,

  /** CARD_LOGIN başarılı olunca çağrılır — bkz. screens/auth/CardLoginScreen.tsx. */
  loginWithCardUser: (user) => set({ currentUser: user, authError: null }),

  logout: () => set({ currentUser: null }),

  clearAuthError: () => set({ authError: null }),
}));

/**
 * Ekranların RBAC/kişiselleştirme için ihtiyaç duyduğu "şu an cihazı kullanan kişi".
 * Eski activeSession?.user yerine artık doğrudan currentUser — çağıran
 * ekranlara (HomeScreen, SettingsScreen vb.) HİÇ dokunulmadı, sadece bu
 * hook'un içi değişti.
 */
export function useActiveUser(): User | null {
  return useAuthStore((s) => s.currentUser);
}