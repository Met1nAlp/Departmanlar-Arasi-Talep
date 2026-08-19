// src/infrastructure/sync/instance.ts
//
// OutboxWorker'ın uygulama genelindeki TEK örneği (RealtimeClient singleton'ıyla
// aynı desen — bkz. infrastructure/realtime/instance.ts).
//
// `dispatch`, entry.operation'a göre gerçek mepsanServerClient çağrılarına
// yönlendiriyor — OutboxWorker'ın kendisi ve onu çağıran ekranlar (api/requests.ts
// hariç) hiç değişmedi. Şu an sadece CREATE_REQUEST enqueue ediliyor (bkz.
// api/requests.ts); ACKNOWLEDGE/READY/CLOSE/CANCEL operasyonlarının backend'de
// karşılığı yok (databasemanager.h'de fonksiyonlar var ama serverhandler.cpp'de
// bağlı komut yok — bkz. Barış'a gönderilecek liste), o yüzden onlar için
// kalıcı hata döndürüyoruz.
//
// İstisna fırlatırsa (bağlı değil / timeout) OutboxWorker zaten kendi catch'inde
// bunu statusCode:0 "Ağ hatası" olarak ele alıp backoff ile yeniden dener —
// burada ayrıca try/catch'e gerek yok.

import { database } from '../db';
import { OutboxWorker, type Dispatch } from './OutboxWorker';
import { useConnectionStore } from '../../store/connectionStore';
import { mepsanServerClient } from '../mepsanServer/instance';
import { buildCreateRequestPayload } from '../mepsanServer/mappers';
import type { Request } from '../../types';

const dispatch: Dispatch = async (entry) => {
  if (entry.operation !== 'CREATE_REQUEST') {
    // Backend'de henüz karşılığı olmayan operasyonlar — tekrar denemenin
    // anlamı yok, kalıcı hata olarak işaretlenir (bkz. dosya başı notu).
    return { ok: false, statusCode: 501, message: `"${entry.operation}" backend'de henüz desteklenmiyor` };
  }

  const response = await mepsanServerClient.send(
    'CREATE_REQUEST',
    buildCreateRequestPayload(entry.payload as Request)
  );

  if (response.status === 'ok') return { ok: true };
  // Uygulama katmanı reddi (örn. eksik/malformed alan) — aynı payload'ı
  // tekrar göndermek sonucu değiştirmez, kalıcı hata say.
  return { ok: false, statusCode: 422, message: response.message ?? 'CREATE_REQUEST reddedildi' };
};

export const outboxWorker = new OutboxWorker(database, dispatch);

/** Plan §12.4 kural 6: ConnectionBanner'daki "Senkronize edilecek: N" rozetini günceller. */
export async function refreshPendingSyncBadge(): Promise<void> {
  const count = await outboxWorker.getPendingCount();
  useConnectionStore.getState().setPendingSyncCount(count);
}
