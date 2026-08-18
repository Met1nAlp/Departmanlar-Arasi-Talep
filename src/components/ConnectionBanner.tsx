// src/components/ConnectionBanner.tsx
//
// Plan Bölüm 9.2: "Bağlantı durumu her zaman görünür ... Kullanıcı asla
// belirsizlikte kalmaz." Plan Bölüm 7.4: bekleyen senkronizasyon sayısı da
// aynı şeritte gösterilir ("Senkronize edilecek: 3").
//
// Bu dosya yalnızca BAĞLAMA katmanıdır: connectionStore'u okur, RealtimeClient'ın
// ConnectionState'ini design-system'in sunum tipine çevirir ve görseli
// design-system/components/ConnectionBanner'a devreder. Görsel karar (renk,
// ikon, ne zaman gizleneceği) orada; durum kaynağı burada.

import { useConnectionStore } from '../store/connectionStore';
import type { ConnectionState } from '../infrastructure/realtime/RealtimeClient';
import {
  ConnectionBanner as ConnectionBannerView,
  type ConnectionStatus,
} from '../design-system/components/ConnectionBanner';

/**
 * RealtimeClient'ın 4 durumunu bandın 3 görsel durumuna indirger.
 * RECONNECTING kullanıcı için CONNECTING'den farklı değildir — ikisi de
 * "bekle, üzerinde çalışıyoruz" demektir (bkz. connectionStatusPresentation).
 */
function toBannerStatus(state: ConnectionState): ConnectionStatus {
  switch (state) {
    case 'CONNECTED':
      return 'connected';
    case 'CONNECTING':
    case 'RECONNECTING':
      return 'connecting';
    case 'DISCONNECTED':
    default:
      return 'disconnected';
  }
}

export default function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  const pendingSyncCount = useConnectionStore((s) => s.pendingSyncCount);

  return <ConnectionBannerView status={toBannerStatus(status)} pendingSyncCount={pendingSyncCount} />;
}
