// src/infrastructure/realtime/MepsanService.ts
//
// Backend (MepsanServer / serverhandler.cpp) ile haberleşme servisi.
// Bu dosya RealtimeClient'ı doğrudan kullanan tek yerdir; ekranlar bu
// fonksiyonları import eder — WebSocket detayına bakmaz.
//
// Backend komutları (serverhandler.cpp):
//   AUTH_REQUEST   → Cihazı sisteme kaydet / onayla
//   TEST           → Bağlantı testi (heartbeat da bu komutu kullanır)
//   START_SYSTEM   → Sistem başlatma
//   PROCESS_QR     → QR kodu doğrula + envanter detayı getir
//   CHECKOUT_ITEM  → Eşyayı envanterden al (kullanıcıya ver)
//   CHECKIN_ITEM   → Eşyayı envantere geri ver

import { realtimeClient, connectRealtime } from './instance';
import type { ServerResponse } from './RealtimeClient';

// ─── Yardımcı: yanıt bekle ──────────────────────────────────────────────────

/**
 * `send` sonrası backend'den ilk yanıtı bekler.
 * Timeout: 10 sn (fabrika Wi-Fi latansı gözetilerek)
 */
function waitForResponse(timeoutMs = 10_000): Promise<ServerResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error('Sunucu yanıt vermedi (timeout).'));
    }, timeoutMs);

    const unsub = realtimeClient.onMessage((response) => {
      clearTimeout(timer);
      unsub();
      resolve(response);
    });
  });
}

// ─── Bağlantı ───────────────────────────────────────────────────────────────

/** Sunucuya bağlan (app başlangıcında ya da oturum açıldığında çağrılır). */
export function connect(): void {
  connectRealtime();
}

// ─── AUTH_REQUEST ────────────────────────────────────────────────────────────

export interface AuthRequestParams {
  deviceId: string;   // expo cihaz UUID'si
  passkey: string;    // fabrika parolası, backend: "MPSN1992"
  username: string;   // giriş yapan kullanıcı adı
}

/**
 * Cihazı backend'e kaydet / onaylat.
 * Başarılı olursa cihaz `pos_devices` tablosuna eklenir.
 */
export async function authRequest(params: AuthRequestParams): Promise<ServerResponse> {
  const sent = realtimeClient.send('AUTH_REQUEST', {
    device_id: params.deviceId,
    passkey: params.passkey,
    username: params.username,
  });
  if (!sent) throw new Error('Sunucuya bağlı değil. Önce bağlantı kurun.');
  return waitForResponse();
}

// ─── TEST ────────────────────────────────────────────────────────────────────

/**
 * Bağlantı testi — backend'den {"status":"ok",...} beklenir.
 * Heartbeat zaten otomatik TEST gönderir; bu fonksiyon manuel test içindir.
 */
export async function testConnection(): Promise<ServerResponse> {
  const sent = realtimeClient.send('TEST');
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

// ─── PROCESS_QR ──────────────────────────────────────────────────────────────

/**
 * QR kodu backend'e gönder, envanter bilgisi al.
 * Yanıt: { status:"ok", item_info: { found: true, ... } }
 */
export async function processQr(qrData: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('PROCESS_QR', { qr_data: qrData });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

// ─── CHECKOUT_ITEM ───────────────────────────────────────────────────────────

/**
 * Eşyayı envanterden al (kullanıcıya ver).
 * @param qrData  Ürünün QR kodu
 * @param username Eşyayı alan kullanıcı adı
 */
export async function checkoutItem(qrData: string, username: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('CHECKOUT_ITEM', { qr_data: qrData, username });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

// ─── CHECKIN_ITEM ────────────────────────────────────────────────────────────

/**
 * Eşyayı envantere geri ver.
 * @param qrData  Ürünün QR kodu
 */
export async function checkinItem(qrData: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('CHECKIN_ITEM', { qr_data: qrData });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

// ─── TALEPLER (REQUESTS) ─────────────────────────────────────────────────────

/** Öncelik seviyeleri — backend ile sözleşme. */
export type Priority = 'NORMAL' | 'URGENT' | 'LINE_DOWN' | 'PLANNED';

export async function sendCreateRequest(requestData: Record<string, unknown>): Promise<ServerResponse> {
  const sent = realtimeClient.send('CREATE_REQUEST', requestData);
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

export async function sendGetRequests(userId?: string, departmentId?: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('GET_REQUESTS', { user_id: userId, department_id: departmentId });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

export async function sendUpdateRequestStatus(id: string, status: string, timestampField: string, timestampValue: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('UPDATE_REQUEST_STATUS', {
    id,
    status,
    timestamp_field: timestampField,
    timestamp_value: timestampValue,
  });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

/** Talebi iptal et. cancelReason boş bırakılabilir. */
export async function sendCancelRequest(id: string, cancelReason = ''): Promise<ServerResponse> {
  const sent = realtimeClient.send('CANCEL_REQUEST', {
    id,
    cancel_reason: cancelReason,
    cancelled_at: new Date().toISOString(),
  });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

/** Talebin önceliğini değiştir (Yönetici yetkisi). */
export async function sendUpdatePriority(id: string, priority: Priority): Promise<ServerResponse> {
  const sent = realtimeClient.send('UPDATE_PRIORITY', { id, priority });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

/**
 * Kısmi veya tam karşılama (Departman Yetkilisi).
 * @param fulfilledQuantity Hazırlanan gerçek miktar
 * @param status 'HAZIR' (tam) veya 'KISMI_HAZIR' (kısmi)
 */
export async function sendFulfillRequest(id: string, fulfilledQuantity: number, status: 'HAZIR' | 'KISMI_HAZIR'): Promise<ServerResponse> {
  const sent = realtimeClient.send('FULFILL_REQUEST', {
    id,
    fulfilled_quantity: fulfilledQuantity,
    status,
    ready_at: new Date().toISOString(),
  });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

/** Talebi eskalasyona al (SLA aşımı veya manuel). */
export async function sendEscalateRequest(id: string): Promise<ServerResponse> {
  const sent = realtimeClient.send('ESCALATE_REQUEST', { id });
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

/** Eskalasyon listesini getir (Yönetici). */
export async function sendGetEscalated(): Promise<ServerResponse> {
  const sent = realtimeClient.send('GET_ESCALATED', {});
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}

// ─── START_SYSTEM ────────────────────────────────────────────────────────────

/** Sistem başlatma komutu. */
export async function startSystem(): Promise<ServerResponse> {
  const sent = realtimeClient.send('START_SYSTEM');
  if (!sent) throw new Error('Sunucuya bağlı değil.');
  return waitForResponse();
}
