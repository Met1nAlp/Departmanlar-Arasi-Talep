// src/store/connectionStore.ts
//
// Bağlantı durumu için global store — Plan Bölüm 9.2: "Bağlantı durumu her
// zaman görünür: Üst çubukta 🟢 Bağlı / 🟡 Bağlanıyor / 🔴 Çevrimdışı.
// Kullanıcı asla belirsizlikte kalmaz." Metin'in ConnectionBanner bileşeni
// (Plan Bölüm 23.3 hook sözleşmesi) bu store'u okuyacak.
//
// RealtimeClient.onStateChange(...) burada set() çağırarak bağlanır — bu
// bağlama işi henüz app/providers katmanı kurulmadığı için yapılmadı
// (bkz. RealtimeClient.ts dosya başı notu).

import { create } from 'zustand';
import type { ConnectionState } from '../infrastructure/realtime/RealtimeClient';

interface ConnectionStoreState {
  status: ConnectionState;
  pendingSyncCount: number; // Plan Bölüm 7.4: "Senkronize edilecek: N" rozeti
  setStatus: (status: ConnectionState) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  status: 'DISCONNECTED',
  pendingSyncCount: 0,
  setStatus: (status) => set({ status }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
}));
