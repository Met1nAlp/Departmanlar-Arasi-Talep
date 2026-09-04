// src/infrastructure/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { mepsanServerClient, fetchRequestById } from '../mepsanServer/instance';
import type { MepsanEventEnvelope } from '../mepsanServer/MepsanServerClient';
import { navigationRef } from '../../navigation/navigationRef';
import { getProductsByIds } from '../../api/products';
import { getRequestById } from '../../api/requests';
import { checkMissedUpdates } from './missedUpdates';
import {
  resolveNotificationForRequest,
  wasRequestKnownToUser,
  forgetKnownStatus,
  getKnownStatus,
  getKnownRequestInfo,
} from './knownStatusStore';
import { database } from '../db';
import NotificationRecord from '../db/models/Notification';
import { useAuthStore } from '../../store/authStore';
import { statusLabels } from '../../utils/statusLabels';
import type { Request, RequestStatus } from '../../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Talep Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

const STATUS_MESSAGES: Partial<Record<RequestStatus, string>> = {
  TALEP_ALINDI: 'Yeni bir talep geldi',
  HAZIRLANIYOR: 'Talebiniz hazırlanmaya başlandı',
  HAZIR: 'Talebiniz hazır',
  YOLDA: 'Talebiniz yolda',
  TESLIM_EDILDI: 'Talebiniz teslim edildi',
  IPTAL_EDILDI: 'Talebiniz iptal edildi',
  REDDEDILDI: 'Talebiniz reddedildi',
};

async function getRequestTitle(request: Request): Promise<string> {
  const [product] = await getProductsByIds([request.productId]);
  return product?.name ?? `Talep ${request.id.toUpperCase()}`;
}

function getStatusMessageBody(request: Request, isNew: boolean): string {
  if (isNew) return STATUS_MESSAGES.TALEP_ALINDI ?? 'Yeni bir talep geldi';
  
  const isPartial =
    request.fulfilledQuantity !== undefined &&
    request.fulfilledQuantity > 0 &&
    request.fulfilledQuantity < request.quantity &&
    (request.status === 'HAZIRLANIYOR' || request.status === 'HAZIR');

  if (isPartial) {
    return `${request.fulfilledQuantity}/${request.quantity} adet karşılandı, kalanı takip ediliyor`;
  }

  return STATUS_MESSAGES[request.status] ?? 'Talep durumu güncellendi';
}

async function showNotification(title: string, body: string, requestId: string): Promise<void> {
  const userId = useAuthStore.getState().currentUser?.id;
  if (!userId) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { requestId }, sound: true },
    trigger: null,
  });

  const collection = database.get<NotificationRecord>('notifications');
  await database.write(async () => {
    await collection.create((row) => {
      row.requestId = requestId;
      row.title = title;
      row.body = body;
      row.isRead = false;
      row.createdAt = Date.now();
      row.userId = userId;
    });
  });
}

/**
 * Bildirime dokunulunca çağrılır. Bildirim eski olabilir (talep o aralar
 * webden silinmiş olabilir) — bu yüzden navigate ETMEDEN ÖNCE talebin hâlâ
 * var olup olmadığını kontrol ediyoruz. Yoksa hiçbir yere gitmiyoruz, sadece
 * kullanıcıya bilgi veriyoruz (aksi halde detay ekranı sonsuza kadar
 * yükleniyor kalıyordu / kullanıcı bunu "hata/çöküyor" olarak yaşıyordu).
 */
async function navigateToRequest(requestId: string): Promise<void> {
  if (!navigationRef.isReady()) return;
  const user = useAuthStore.getState().currentUser;
  if (!user) return;

  const request = await getRequestById(requestId);
  if (!request) {
    Alert.alert('Talep bulunamadı', 'Bu talep artık mevcut değil — silinmiş olabilir.');
    return;
  }

  if (user.role === 'departman_yetkilisi') {
    // @ts-expect-error - navigationRef tip parametresiz, farklı stack'lere göre dinamik navigate ediyoruz
    navigationRef.navigate('RequestDetail', { requestId });
  } else if (user.role === 'uretim_yoneticisi') {
    // @ts-expect-error - navigationRef tip parametresiz, farklı stack'lere göre dinamik navigate ediyoruz
    navigationRef.navigate('RequestTracking', { requestId });
  }
}

// Silinme anında talep zaten hazırlık aşamasındaysa (HAZIRLANIYOR/HAZIR),
// personel muhtemelen malzemeyi çoktan hazırlamış/ayırmıştır — normal "silindi"
// bildirimi yeterli değil, malzemeyi GERİ KOYMASI gerektiğini açıkça söyleyen
// ayrı ve daha dikkat çekici bir uyarı gösteriyoruz.
const ALREADY_PREPARED_STATUSES: RequestStatus[] = ['HAZIRLANIYOR', 'HAZIR'];

/**
 * REQUEST_DELETED (backend'de henüz YOK — Barış eklemeli): bir talep
 * webden/adminden silindiğinde sunucu diğer broadcast'lerle aynı zarfla
 * { type: "event", event_name: "REQUEST_DELETED", payload: { id } } yayınlamalı.
 *
 * Talep artık GET_REQUESTS'te dönmediği için ürün/departman bilgisine
 * doğrudan ulaşamıyoruz — bu yüzden hem "bu kullanıcıyı ilgilendiriyor mu"
 * kararını hem de bildirim İÇERİĞİNİ (ürün adı, hangi aşamadaydı)
 * knownStatusStore'daki kayıttan (bu talebi daha önce görmüş müyüz, o anda
 * ne biliyorduk) veriyoruz.
 *
 * ÖNEMLİ: bu fonksiyon HER cihazda kendi currentUser'ına göre çalışır — yani
 * hem talebi oluşturan saha personelinin/üretim yöneticisinin cihazında, hem
 * de ilgili departman yetkilisinin cihazında AYRI AYRI tetiklenir (ikisi de
 * resolveNotificationForRequest'te "isConcerned" sayıldığı için kendi known
 * map'lerinde bu talebi tutuyor olacaklar). Ekstra bir "iki tarafa da gönder"
 * mantığına gerek yok, mimari zaten bunu sağlıyor.
 */
async function handleRequestDeleted(requestId: string): Promise<void> {
  const known = await wasRequestKnownToUser(database, requestId);
  if (!known) return;

  // Unutmadan ÖNCE son bilinen durumu/bilgiyi oku — silinme anında hangi
  // ürün, hangi aşamadaydı ayrımını bundan sonra yapamayız.
  const [lastKnownStatus, info] = await Promise.all([
    getKnownStatus(database, requestId),
    getKnownRequestInfo(database, requestId),
  ]);

  const product = info ? (await getProductsByIds([info.productId]))[0] : undefined;
  const productLabel = product?.name ?? `Talep ${requestId.toUpperCase()}`;
  const stageLabel = lastKnownStatus ? statusLabels[lastKnownStatus] : undefined;

  if (lastKnownStatus && ALREADY_PREPARED_STATUSES.includes(lastKnownStatus)) {
    await showNotification(
      '⚠️ Hazırlanan talep iptal edildi',
      `${productLabel} (${requestId.toUpperCase()}) "${stageLabel}" aşamasındayken sistemden silindi — malzemeyi geri koymanız gerekebilir.`,
      requestId
    );
  } else {
    await showNotification(
      'Talep silindi',
      stageLabel
        ? `${productLabel} (${requestId.toUpperCase()}) "${stageLabel}" aşamasındayken sistemden kaldırıldı.`
        : `${productLabel} (${requestId.toUpperCase()}) sistemden kaldırıldı.`,
      requestId
    );
  }

  await forgetKnownStatus(database, requestId);
}

let initialized = false;

export function initNotificationService(): () => void {
  if (initialized) return () => {};
  initialized = true;

  void requestNotificationPermission();

  const unsubscribeEvent = mepsanServerClient.onEvent((event: MepsanEventEnvelope) => {
    if (event.event_name === 'REQUEST_DELETED') {
      const id = event.payload?.id;
      if (typeof id !== 'string' || !id) return;
      void handleRequestDeleted(id);
      return;
    }

    const relevantEvents = ['REQUEST_CREATED', 'REQUEST_STATUS_UPDATED', 'CANCEL_REQUEST', 'REJECT_REQUEST'];
    if (!relevantEvents.includes(event.event_name)) return;

    const id = event.payload?.id;
    if (typeof id !== 'string' || !id) return;

    void fetchRequestById(id).then(async (request) => {
      if (!request) return;

      const { notify, isNew } = await resolveNotificationForRequest(database, request);
      if (!notify) return;

      const title = await getRequestTitle(request);
      const body = getStatusMessageBody(request, isNew);
      void showNotification(title, body, request.id);
    });
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const requestId = response.notification.request.content.data?.requestId as string | undefined;
    if (requestId) void navigateToRequest(requestId);
  });

  return () => {
    unsubscribeEvent();
    responseSubscription.remove();
  };
}

export async function checkAndNotifyMissedUpdates(database: Database): Promise<void> {
  const missed = await checkMissedUpdates(database);
  for (const { request, isNew } of missed) {
    const title = await getRequestTitle(request);
    const body = getStatusMessageBody(request, isNew);
    await showNotification(title, body, request.id);
  }
}

export function observeUnreadCount(callback: (count: number) => void): () => void {
  const userId = useAuthStore.getState().currentUser?.id;
  if (!userId) {
    callback(0);
    return () => {};
  }
  const collection = database.get<NotificationRecord>('notifications');
  const subscription = collection
    .query(Q.where('is_read', false), Q.where('user_id', userId))
    .observeCount()
    .subscribe(callback);
  return () => subscription.unsubscribe();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const collection = database.get<NotificationRecord>('notifications');
  const record = await collection.find(id);
  await database.write(async () => {
    await record.update((row) => {
      row.isRead = true;
    });
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const userId = useAuthStore.getState().currentUser?.id;
  if (!userId) return;
  const collection = database.get<NotificationRecord>('notifications');
  const unread = await collection.query(Q.where('is_read', false), Q.where('user_id', userId)).fetch();
  await database.write(async () => {
    await Promise.all(unread.map((row) => row.update((r) => { r.isRead = true; })));
  });
}