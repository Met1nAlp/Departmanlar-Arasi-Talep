// src/domain/request/legacyAdapter.ts
//
// Köprü katmanı: mevcut prototipteki basitleştirilmiş 5 durumlu akış
// (src/types/index.ts -> RequestStatus) ile plandaki 14 durumlu tam
// RequestStateMachine arasında bağlantı kurar.
//
// NEDEN GEREKLİ: Veri modelinin tamamının (MaterialRequest, çok satırlı
// RequestLine, ACKNOWLEDGED/REJECTED/PARTIALLY_READY vb. ara durumlar) backend
// hazır olmadan taşınması riskli ve şu an gereksiz — bkz. PDF görev listesi E1
// notu: "Ekranların yeni tiplere taşınması ayrı bir commit'te yapılacak."
// Bu dosya o taşımanın İLK adımı: ekranlardaki sabit `nextStatusMap` yerine
// artık RequestPolicies (RBAC) üzerinden karar veriliyor, state machine'in
// isimlendirmesiyle tutarlı kalıyor. Backend @mts/contracts'a geçtiğinde bu
// dosya kaldırılıp ekranlar doğrudan RequestStateMachine'i kullanacak.
//
// Eşleme (bilinçli basitleştirme — plan Bölüm 7.1'in bir alt kümesi):
//   TALEP_ALINDI  ~ PENDING
//   HAZIRLANIYOR  ~ PREPARING   (ACKNOWLEDGED adımı UI'da tek dokunuşta atlanıyor)
//   HAZIR         ~ READY_FOR_PICKUP
//   YOLDA         ~ IN_TRANSIT
//   TESLIM_EDILDI ~ DELIVERED   (CLOSED adımı henüz UI'da yok)

import type { Role } from '../../contracts/types';
import { LEGACY_ROLE_MAP } from '../../contracts/types';
import { canAcknowledgeOrPrepare, canClose, canCreate, type PolicyContext } from './RequestPolicies';

// Bu tipler src/types/index.ts ile birebir aynı tutulur (import etmiyoruz ki
// domain katmanı legacy tiplere bağımlı olmasın — sadece string literal paylaşıyoruz).
export type LegacyStatus = 'TALEP_ALINDI' | 'HAZIRLANIYOR' | 'HAZIR' | 'YOLDA' | 'TESLIM_EDILDI';
export type LegacyRole = 'saha_personeli' | 'departman_yetkilisi' | 'yonetici';

export const LEGACY_TO_DOMAIN_STATE: Record<LegacyStatus, string> = {
  TALEP_ALINDI: 'PENDING',
  HAZIRLANIYOR: 'PREPARING',
  HAZIR: 'READY_FOR_PICKUP',
  YOLDA: 'IN_TRANSIT',
  TESLIM_EDILDI: 'DELIVERED',
};

/** Eski ekranlardaki `nextStatusMap`'in yerini alır — tek doğru kaynak burası. */
export const LEGACY_NEXT_STATUS: Partial<Record<LegacyStatus, LegacyStatus>> = {
  TALEP_ALINDI: 'HAZIRLANIYOR',
  HAZIRLANIYOR: 'HAZIR',
  HAZIR: 'YOLDA',
};

export const LEGACY_NEXT_ACTION_LABEL: Partial<Record<LegacyStatus, string>> = {
  TALEP_ALINDI: 'Hazırlamaya Başla',
  HAZIRLANIYOR: '"Hazır" Olarak İşaretle',
  HAZIR: 'Elektrikli Transpalet ile Yola Çık',
};

function toDomainRole(role: LegacyRole): Role {
  return LEGACY_ROLE_MAP[role];
}

/**
 * Tedarikçi tarafındaki "ilerlet" butonunun görünüp görünmeyeceğini,
 * plan Bölüm 6.3 RBAC tablosuna göre karar verir (RequestPolicies üzerinden).
 * Şu anki prototipte tüm departman_yetkilisi kullanıcıları SUPPLIER sayılır.
 */
export function canAdvanceLegacyStatus(actorLegacyRole: LegacyRole): boolean {
  const ctx: PolicyContext = { actorUserId: 'n/a', actorRole: toDomainRole(actorLegacyRole) };
  return canAcknowledgeOrPrepare(ctx);
}

/**
 * Talep eden tarafındaki "teslim aldım" onay butonunun görünürlüğü.
 * requesterUserId/actorUserId eşleşmesi mevcut prototipte tekil kullanıcı
 * varsayımıyla basitleştirilmiştir (çoklu kullanıcı senaryosu backend ile gelir).
 */
export function canConfirmDelivery(actorLegacyRole: LegacyRole): boolean {
  const ctx: PolicyContext = { actorUserId: 'self', actorRole: toDomainRole(actorLegacyRole) };
  const fakeRequestOwnedBySelf = { requesterUserId: 'self' } as Parameters<typeof canClose>[0];
  return canClose(fakeRequestOwnedBySelf, ctx);
}

/**
 * "Yeni çağrı" başlatma yetkisi (Home ekranındaki + butonu). RBAC: plan Bölüm 6.3
 * "Çağrı oluştur" satırı — PLANNER hariç herkes oluşturabilir.
 */
export function canCreateLegacyRequest(actorLegacyRole: LegacyRole): boolean {
  return canCreate({ actorUserId: 'self', actorRole: toDomainRole(actorLegacyRole) });
}
