// src/infrastructure/realtime/connectionStatusPresentation.ts
//
// ConnectionState -> ekranda gösterilecek renk/etiket eşlemesi. Plan Bölüm
// 9.2: "Üst çubukta 🟢 Bağlı / 🟡 Bağlanıyor / 🔴 Çevrimdışı." Saf fonksiyon
// olarak ayrıldı ki UI'a dokunmadan test edilebilsin (Plan Bölüm 21.2 test
// stratejisi ruhuna uygun).

import type { ConnectionState } from './RealtimeClient';
import { colors } from '../../constants/theme';

export interface ConnectionStatusPresentation {
  label: string;
  dotColor: string;
}

export function getConnectionStatusPresentation(state: ConnectionState): ConnectionStatusPresentation {
  switch (state) {
    case 'CONNECTED':
      return { label: 'Bağlı', dotColor: '#2ECC71' };
    case 'CONNECTING':
    case 'RECONNECTING':
      return { label: 'Bağlanıyor', dotColor: '#F2A93B' };
    case 'DISCONNECTED':
    default:
      return { label: 'Çevrimdışı', dotColor: colors.textMuted };
  }
}
