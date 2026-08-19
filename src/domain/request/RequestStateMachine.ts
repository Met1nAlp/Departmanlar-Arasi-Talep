// src/domain/request/RequestStateMachine.ts
//
// Çağrı (MaterialRequest) durum makinesi. Kaynak: MEPSAN_MTS_Proje_Plani.md
// Bölüm 7.1 (mermaid stateDiagram) ve Bölüm 6.3 (yetki matrisi).
//
// KURAL (Plan Bölüm 7.1): "Geçişler yalnızca sunucuda uygulanır. Mobil taraf
// niyet (intent) gönderir, sunucu geçişi doğrular." Bu dosya sunucudaki gerçek
// karar mantığının İSTEMCİ TARAFI ÖN-DOĞRULAMASIDIR: kullanıcıya UI'da doğru
// eylemi göstermek ve gecikmeden hatalı isteği engellemek için kullanılır.
// Nihai otorite her zaman backend'dedir (bkz. Mimari prensip #1, Bölüm 8.2).
//
// Bu dosya hiçbir şey import etmez (React, fetch yok) — @mts/contracts hariç,
// o da saf tip/sabit sözleşmesidir.

import type { Role, RequestState } from '../../contracts/types';
import { TERMINAL_STATES } from '../../contracts/types';

export type TransitionActor = 'USER' | 'SYSTEM';

export interface TransitionRule {
  from: RequestState;
  to: RequestState;
  /** Bu geçişi kimlerin tetikleyebileceği. SYSTEM geçişleri kullanıcı eylemiyle tetiklenmez. */
  allowedRoles: readonly Role[];
  actor: TransitionActor;
  /** Plan dokümanındaki olay adı — denetim izi ve UI metni için. */
  label: string;
}

/**
 * Plan Bölüm 7.1'deki mermaid stateDiagram'ın birebir kodlanmış hâli.
 * Sıra diyagramdaki sırayla korunmuştur; okurken diyagramla karşılaştırılabilir.
 */
export const TRANSITIONS: readonly TransitionRule[] = [
  { from: 'DRAFT', to: 'PENDING', allowedRoles: ['REQUESTER', 'SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'gönder' },

  { from: 'PENDING', to: 'ACKNOWLEDGED', allowedRoles: ['SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'tedarikçi görevi üstlenir' },
  { from: 'PENDING', to: 'CANCELLED', allowedRoles: ['REQUESTER', 'SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'talep eden iptal eder' },
  { from: 'PENDING', to: 'ESCALATED', allowedRoles: [], actor: 'SYSTEM', label: 'SLA süresi aşıldı' },

  { from: 'ESCALATED', to: 'ACKNOWLEDGED', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'amir yönlendirdi' },
  { from: 'ESCALATED', to: 'CANCELLED', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'amir iptal etti' },

  { from: 'ACKNOWLEDGED', to: 'PREPARING', allowedRoles: ['SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'hazırlığa başlandı' },
  { from: 'ACKNOWLEDGED', to: 'REJECTED', allowedRoles: ['SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'stok yok / yanlış bölüm' },

  { from: 'REJECTED', to: 'PENDING', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'amir başka bölüme yönlendirdi' },
  { from: 'REJECTED', to: 'CANCELLED', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'karşılanamaz' },

  { from: 'PREPARING', to: 'READY_FOR_PICKUP', allowedRoles: ['SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'QR doğrulandı, adet girildi' },
  { from: 'PREPARING', to: 'PARTIALLY_READY', allowedRoles: ['SUPPLIER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'kısmi karşılama' },

  { from: 'PARTIALLY_READY', to: 'READY_FOR_PICKUP', allowedRoles: ['REQUESTER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'talep eden kabul etti' },
  { from: 'PARTIALLY_READY', to: 'PENDING', allowedRoles: ['REQUESTER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'kalan için yeni çağrı' },

  { from: 'READY_FOR_PICKUP', to: 'IN_TRANSIT', allowedRoles: [], actor: 'SYSTEM', label: 'araç yükü aldı' },
  { from: 'READY_FOR_PICKUP', to: 'CANCELLED', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'iptal (istisnai)' },

  { from: 'IN_TRANSIT', to: 'DELIVERED', allowedRoles: [], actor: 'SYSTEM', label: 'hedefe ulaştı' },
  { from: 'IN_TRANSIT', to: 'EXCEPTION', allowedRoles: [], actor: 'SYSTEM', label: 'araç arızası / engel' },

  { from: 'EXCEPTION', to: 'IN_TRANSIT', allowedRoles: [], actor: 'SYSTEM', label: 'sorun giderildi' },
  { from: 'EXCEPTION', to: 'MANUAL_HANDOVER', allowedRoles: ['SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'elle taşımaya devredildi' },

  { from: 'DELIVERED', to: 'CLOSED', allowedRoles: ['REQUESTER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'talep eden teslim onayı verdi' },
  { from: 'MANUAL_HANDOVER', to: 'CLOSED', allowedRoles: ['REQUESTER', 'SUPERVISOR', 'ADMIN'], actor: 'USER', label: 'elle teslim onaylandı' },
] as const;

export type TransitionCheckResult =
  | { ok: true }
  | { ok: false; reason: 'UNKNOWN_TRANSITION' | 'TERMINAL_STATE' | 'ROLE_NOT_ALLOWED' | 'SYSTEM_ONLY' };

function findRule(from: RequestState, to: RequestState): TransitionRule | undefined {
  return TRANSITIONS.find((r) => r.from === from && r.to === to);
}

/**
 * Bir kullanıcı eyleminin (actorRole) from -> to geçişini yapıp yapamayacağını kontrol eder.
 * SYSTEM tipi geçişler (SLA eskalasyonu, AGV olayları) burada reddedilir — onlar
 * `canSystemTransition` ile ayrı değerlendirilir çünkü kullanıcı eylemi değildir.
 */
export function canTransition(from: RequestState, to: RequestState, actorRole: Role): TransitionCheckResult {
  if (TERMINAL_STATES.includes(from)) {
    return { ok: false, reason: 'TERMINAL_STATE' };
  }
  const rule = findRule(from, to);
  if (!rule) {
    return { ok: false, reason: 'UNKNOWN_TRANSITION' };
  }
  if (rule.actor === 'SYSTEM') {
    return { ok: false, reason: 'SYSTEM_ONLY' };
  }
  if (!rule.allowedRoles.includes(actorRole)) {
    return { ok: false, reason: 'ROLE_NOT_ALLOWED' };
  }
  return { ok: true };
}

/** Sistem (backend/AGV/scheduler) tarafından tetiklenen geçişlerin geçerliliğini kontrol eder. */
export function canSystemTransition(from: RequestState, to: RequestState): boolean {
  const rule = findRule(from, to);
  return rule?.actor === 'SYSTEM';
}

/** Verilen durumdan, verilen rolün tetikleyebileceği tüm hedef durumları döner (UI'da eylem butonları için). */
export function availableTransitions(from: RequestState, actorRole: Role): TransitionRule[] {
  if (TERMINAL_STATES.includes(from)) return [];
  return TRANSITIONS.filter((r) => r.from === from && r.actor === 'USER' && r.allowedRoles.includes(actorRole));
}

export function isTerminal(state: RequestState): boolean {
  return TERMINAL_STATES.includes(state);
}
