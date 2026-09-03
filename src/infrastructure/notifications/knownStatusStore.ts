// src/infrastructure/notifications/knownStatusStore.ts
//
// TEK GERÇEK KAYNAK: her kullanıcının, her talep için "en son bildiği durum"
// burada tutuluyor. Hem canlı (WebSocket event) hem kaçırılan-güncelleme
// (uygulama açılışı) bildirim kararları BURADAN, aynı karşılaştırmadan
// geçiyor. Eskiden "kim yaptı" bilgisini cancelReason/role gibi kırılgan
// ipuçlarından tahmin etmeye çalışıyorduk — ama sunucu bu alanları
// GET_REQUESTS'te hiç geri döndürmüyor (doğrulandı), üstelik CANCEL_REQUEST
// ve REJECT_REQUEST ikisi de aynı IPTAL_EDILDI durumuna düşüyor. O yüzden
// artık şu kurala geçiyoruz: "Bir işlemi KENDİM yaptığımda, sunucuya
// göndermeden önce kendi hafızama hemen yazarım (recordOwnStatusChange).
// Böylece sunucudan yankı geldiğinde benim için YENİ bir bilgi olmaz,
// bildirim tetiklenmez."

import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import KvStoreEntry from '../db/models/KvStoreEntry';
import { useAuthStore } from '../../store/authStore';
import type { Request, RequestStatus } from '../../types';

function getKnownStatusesKey(userId: string): string {
  return `knownRequestStatuses:${userId}`;
}

type KnownStatusMap = Record<string, RequestStatus>;

async function getKnownStatuses(database: Database, key: string): Promise<KnownStatusMap> {
  const collection = database.get<KvStoreEntry>('kv_store');
  const rows = await collection.query(Q.where('key', key)).fetch();
  if (!rows.length) return {};
  try {
    return JSON.parse(rows[0].value) as KnownStatusMap;
  } catch {
    return {};
  }
}

async function saveKnownStatuses(database: Database, key: string, map: KnownStatusMap): Promise<void> {
  const collection = database.get<KvStoreEntry>('kv_store');
  const rows = await collection.query(Q.where('key', key)).fetch();
  await database.write(async () => {
    if (rows[0]) {
      await rows[0].update((row) => {
        row.value = JSON.stringify(map);
      });
    } else {
      await collection.create((row) => {
        row.key = key;
        row.value = JSON.stringify(map);
      });
    }
  });
}

/**
 * Bir işlemi KENDİMİZ yaptığımızda hemen çağrılır (bkz. api/requests.ts).
 * Sunucudan broadcast geri geldiğinde artık "farklı bir durum" olarak
 * görünmeyecek, bildirim tetiklenmeyecek.
 */
export async function recordOwnStatusChange(
  database: Database,
  requestId: string,
  status: RequestStatus
): Promise<void> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return;
  const key = getKnownStatusesKey(user.id);
  const known = await getKnownStatuses(database, key);
  known[requestId] = status;
  await saveKnownStatuses(database, key, known);
}

export async function hasAnyKnownStatus(database: Database, userId: string): Promise<boolean> {
  const key = getKnownStatusesKey(userId);
  const known = await getKnownStatuses(database, key);
  return Object.keys(known).length > 0;
}

/**
 * Bir talep sunucudan silindiğinde artık GET_REQUESTS'te dönmüyor — o yüzden
 * "bu kullanıcıyı ilgilendiriyor mu" kararını Request objesi üzerinden
 * (departmentId/requesterId) veremiyoruz. known map zaten SADECE ilgili
 * (resolveNotificationForRequest'ten notify=true/false fark etmeksizin
 * isConcerned geçmiş) talepleri tutuyor — bu yüzden requestId'nin burada
 * bir anahtar olarak bulunması, "bu kullanıcı bu talebi biliyordu/ilgiliydi"
 * demek için yeterli.
 */
export async function wasRequestKnownToUser(database: Database, requestId: string): Promise<boolean> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return false;
  const key = getKnownStatusesKey(user.id);
  const known = await getKnownStatuses(database, key);
  return requestId in known;
}

/**
 * Bir talebin en son bilinen durumunu döner (REQUEST_DELETED geldiğinde,
 * unutmadan ÖNCE "zaten hazırlanmış mıydı" ayrımını yapabilmek için —
 * bkz. notificationService.handleRequestDeleted).
 */
export async function getKnownStatus(database: Database, requestId: string): Promise<RequestStatus | undefined> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return undefined;
  const key = getKnownStatusesKey(user.id);
  const known = await getKnownStatuses(database, key);
  return known[requestId];
}

/** REQUEST_DELETED sonrası known map'ten temizlemek için — artık var olmayan bir talebin durumu takip edilmemeli. */
export async function forgetKnownStatus(database: Database, requestId: string): Promise<void> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return;
  const key = getKnownStatusesKey(user.id);
  const known = await getKnownStatuses(database, key);
  if (!(requestId in known)) return;
  delete known[requestId];
  await saveKnownStatuses(database, key, known);
}

export interface NotificationDecision {
  notify: boolean;
  isNew: boolean; // true: bu talep bu kullanıcı için ilk kez görülüyor
}

/**
 * Hem canlı (WebSocket event) hem kaçırılan-güncelleme (uygulama açılışı)
 * yolundan çağrılan TEK karar noktası. Her çağrı, known map'i günceller —
 * aynı durum bir daha "farklı" görünmesin diye.
 */
export async function resolveNotificationForRequest(
  database: Database,
  request: Request,
  options: { suppressAll?: boolean } = {}
): Promise<NotificationDecision> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return { notify: false, isNew: false };

  const isConcerned =
    (user.role === 'departman_yetkilisi' && request.departmentId === user.departmentId) ||
    (user.role === 'uretim_yoneticisi' && request.requesterId === user.id);
  if (!isConcerned) return { notify: false, isNew: false };

  const key = getKnownStatusesKey(user.id);
  const known = await getKnownStatuses(database, key);
  const previousStatus = known[request.id];
  const isNew = previousStatus === undefined;
  const isGenuineChange = previousStatus !== request.status;

  const isNotifyWorthy =
    user.role === 'departman_yetkilisi'
      // Yeni talep geldiğinde VE saha personeli kendi talebini iptal
      // ettiğinde departman bilgilendirilir — ikinci durumda "artık
      // hazırlamana gerek yok" anlamına gelir.
      ? request.status === 'TALEP_ALINDI' || request.status === 'IPTAL_EDILDI' || request.status === 'REDDEDILDI'
      : request.status !== 'TALEP_ALINDI';

  const notify = !options.suppressAll && isGenuineChange && isNotifyWorthy;

  known[request.id] = request.status;
  await saveKnownStatuses(database, key, known);

  return { notify, isNew };
}