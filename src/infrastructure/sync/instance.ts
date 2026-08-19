// src/infrastructure/sync/instance.ts
//
// OutboxWorker'ın uygulama genelindeki TEK örneği (RealtimeClient singleton'ıyla
// aynı desen — bkz. infrastructure/realtime/instance.ts).
//
// `mockDispatch` gerçek backend uçları henüz olmadığı için (Plan §11.1) her
// zaman başarı döner. Backend hazır olduğunda buradaki tek fonksiyon,
// entry.operation'a göre gerçek fetch çağrılarına yönlendirilecek şekilde
// değiştirilecek — OutboxWorker'ın kendisi ve onu çağıran ekranlar hiç değişmez.

import { database } from '../db';
import { OutboxWorker, type Dispatch } from './OutboxWorker';
import { useConnectionStore } from '../../store/connectionStore';

const mockDispatch: Dispatch = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // ağ gecikmesi simülasyonu
  return { ok: true };
};

export const outboxWorker = new OutboxWorker(database, mockDispatch);

/** Plan §12.4 kural 6: ConnectionBanner'daki "Senkronize edilecek: N" rozetini günceller. */
export async function refreshPendingSyncBadge(): Promise<void> {
  const count = await outboxWorker.getPendingCount();
  useConnectionStore.getState().setPendingSyncCount(count);
}
