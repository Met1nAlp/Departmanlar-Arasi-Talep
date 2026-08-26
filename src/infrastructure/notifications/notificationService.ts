// src/infrastructure/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';
import { mepsanServerClient, fetchRequestById } from '../mepsanServer/instance';
import type { MepsanEventEnvelope } from '../mepsanServer/MepsanServerClient';
import { navigationRef } from '../../navigation/navigationRef';
import { getProductsByIds } from '../../api/products';
import { checkMissedUpdates } from './missedUpdates';
import { resolveNotificationForRequest } from './knownStatusStore';
import { database } from '../db';
import NotificationRecord from '../db/models/Notification';
import { useAuthStore } from '../../store/authStore';
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
    content: { title, body, data: { requestId } },
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

function navigateToRequest(requestId: string): void {
  if (!navigationRef.isReady()) return;
  const user = useAuthStore.getState().currentUser;
  if (!user) return;

  if (user.role === 'departman_yetkilisi') {
    // @ts-expect-error - navigationRef tip parametresiz, farklı stack'lere göre dinamik navigate ediyoruz
    navigationRef.navigate('RequestDetail', { requestId });
  } else if (user.role === 'saha_personeli') {
    // @ts-expect-error - navigationRef tip parametresiz, farklı stack'lere göre dinamik navigate ediyoruz
    navigationRef.navigate('RequestTracking', { requestId });
  }
}

let initialized = false;

export function initNotificationService(): () => void {
  if (initialized) return () => {};
  initialized = true;

  void requestNotificationPermission();

  const unsubscribeEvent = mepsanServerClient.onEvent((event: MepsanEventEnvelope) => {
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
    if (requestId) navigateToRequest(requestId);
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