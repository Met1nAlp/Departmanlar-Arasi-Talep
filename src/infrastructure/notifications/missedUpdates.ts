// src/infrastructure/notifications/missedUpdates.ts
import type { Database } from '@nozbe/watermelondb';
import { getRequests } from '../../api/requests';
import { useAuthStore } from '../../store/authStore';
import { resolveNotificationForRequest, hasAnyKnownStatus } from './knownStatusStore';
import type { Request } from '../../types';

export interface MissedUpdate {
  request: Request;
  isNew: boolean;
}

/**
 * Uygulama açılışında bir kez çağrılır. Karar mantığı TAMAMEN
 * knownStatusStore.resolveNotificationForRequest'te — bu fonksiyon sadece
 * "ilk senkron mu" (baseline, bildirim üretme) ayrımını yapıp listeyi dolaşır.
 */
export async function checkMissedUpdates(database: Database): Promise<MissedUpdate[]> {
  const user = useAuthStore.getState().currentUser;
  if (!user) return [];

  const params =
    user.role === 'departman_yetkilisi'
      ? { departmentId: user.departmentId }
      : user.role === 'saha_personeli'
        ? { userId: user.id }
        : null;
  if (!params) return [];

  const requests = await getRequests(params);
  const isFirstEverSync = !(await hasAnyKnownStatus(database, user.id));

  const missed: MissedUpdate[] = [];
  for (const request of requests) {
    const { notify, isNew } = await resolveNotificationForRequest(database, request, {
      suppressAll: isFirstEverSync,
    });
    if (notify) {
      missed.push({ request, isNew });
    }
  }
  return missed;
}