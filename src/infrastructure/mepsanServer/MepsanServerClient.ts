// src/infrastructure/mepsanServer/MepsanServerClient.ts
//
// Barış'ın Qt/C++ WebSocket sunucusu (Mepsan_Server/MepsanServer) için ham
// WebSocket istemcisi. RealtimeClient.ts'ten KASITLI olarak bağımsız — o
// Socket.IO'ya bağımlı ve bu sunucuyla uyumsuz (bkz. RealtimeClient.ts dosya
// başı notu), bu yüzden ondan hiçbir şey import etmiyoruz.
//
// Sunucu protokolü (serverhandler.cpp'den doğrulandı):
//   - Her mesaj JSON: { command, mac_address, ...alanlar }, mac_address HER
//     mesajda zorunlu (AUTH_REQUEST dahil).
//   - AUTH_REQUEST dışında hiçbir komut, MAC yetkilendirilmeden çalışmaz.
//   - Cevaplar { status: "ok"|"error", message, ... } şeklinde ama bir istek
//     kimliği (id) TAŞIMIYOR — cevaplar gönderilme sırasına göre gelir
//     (FIFO). Bu yüzden pending kuyruğu FIFO sırayla eşleştirilir.
//   - Sunucu ayrıca kendiliğinden { type: "event", event_name, payload }
//     şeklinde broadcast mesajları gönderir (CREATE_REQUEST/UPDATE_REQUEST_STATUS
//     başarılı olunca tüm bağlı istemcilere). Bunlar HİÇBİR isteğin cevabı
//     DEĞİLDİR — FIFO kuyruğuna dokunmadan doğrudan onEvent dinleyicilerine
//     yönlendirilir (ayrım: "type" alanı var mı yok mu).

import { reconnectDelayMs } from '../realtime/backoff';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface MepsanEventEnvelope {
  type: 'event';
  event_name: string;
  payload: Record<string, unknown>;
}

export interface MepsanResponse {
  status: 'ok' | 'error';
  message?: string;
  [key: string]: unknown;
}

interface PendingRequest {
  resolve: (response: MepsanResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface MepsanServerClientOptions {
  url: string;
  /** Adım 6'ya kadar geçici olarak deviceStore.deviceUid döner (bkz. instance.ts). */
  getMacAddress: () => string | null;
  requestTimeoutMs?: number; // varsayılan 10_000
}

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export class MepsanServerClient {
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private readonly pendingQueue: PendingRequest[] = [];
  private readonly stateListeners = new Set<(state: ConnectionState) => void>();
  private readonly eventListeners = new Set<(event: MepsanEventEnvelope) => void>();
  private readonly requestTimeoutMs: number;

  constructor(private readonly options: MepsanServerClientOptions) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  /** Sunucudan gelen broadcast olaylarını dinle (REQUEST_CREATED, REQUEST_STATUS_UPDATED vb.). */
  onEvent(listener: (event: MepsanEventEnvelope) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  connect(): Promise<void> {
    if (this.socket) return Promise.resolve();
    this.manuallyClosed = false;
    this.setState(this.reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');

    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(this.options.url);
      this.socket = socket;

      socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.setState('CONNECTED');
        settled = true;
        resolve();
      };

      socket.onmessage = (event) => this.handleMessage(event.data);

      socket.onerror = () => {
        // onclose zaten peşinden gelecek — asıl temizlik orada yapılır.
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket bağlantı hatası'));
        }
      };

      socket.onclose = () => {
        this.socket = null;
        this.rejectAllPending('Bağlantı kapandı');
        if (this.manuallyClosed) {
          this.setState('DISCONNECTED');
        } else {
          this.scheduleReconnect();
        }
      };
    });
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending('Bağlantı kapatıldı');
    this.socket?.close();
    this.socket = null;
    this.reconnectAttempt = 0;
    this.setState('DISCONNECTED');
  }

  /**
   * Bir komut gönderir, mac_address'i otomatik ekler, cevabı FIFO sırayla
   * bekler. `payload` zaten snake_case alan adlarıyla gelmeli (mappers.ts).
   */
  send(command: string, payload: Record<string, unknown> = {}): Promise<MepsanResponse> {
    if (!this.socket || this.state !== 'CONNECTED') {
      return Promise.reject(new Error('Sunucuya bağlı değil'));
    }

    const macAddress = this.options.getMacAddress();
    if (!macAddress) {
      return Promise.reject(new Error('MAC adresi (cihaz kimliği) henüz hazır değil'));
    }

    const message = { command, mac_address: macAddress, ...payload };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pendingQueue.findIndex((p) => p.resolve === resolve);
        if (index !== -1) this.pendingQueue.splice(index, 1);
        reject(new Error(`"${command}" isteği zaman aşımına uğradı`));
      }, this.requestTimeoutMs);

      this.pendingQueue.push({ resolve, reject, timeout });

      try {
        this.socket!.send(JSON.stringify(message));
      } catch (err) {
        const index = this.pendingQueue.findIndex((p) => p.resolve === resolve);
        if (index !== -1) this.pendingQueue.splice(index, 1);
        clearTimeout(timeout);
        reject(err instanceof Error ? err : new Error('Gönderim hatası'));
      }
    });
  }

  /**
   * AUTH_REQUEST gönderir. Sunucuda mac_address UNIQUE olduğu için, zaten
   * yetkilendirilmiş bir cihaz için tekrar çağrılırsa sunucu "Cihaz
   * kaydedilemedi" hatası döner (INSERT çakışması) — bu GERÇEK bir hata
   * değil, "zaten yetkili" anlamına gelir, o yüzden ayrı ele alınır.
   */
  async authenticate(params: { deviceId: string; username: string; passkey: string }): Promise<boolean> {
    const response = await this.send('AUTH_REQUEST', {
      device_id: params.deviceId,
      username: params.username,
      passkey: params.passkey,
    });

    if (response.status === 'ok') return true;

    const message = String(response.message ?? '');
    if (message.includes('kaydedilemedi')) {
      // MAC zaten pos_devices tablosunda kayıtlı (UNIQUE çakışması) — zaten yetkili sayılır.
      return true;
    }
    // Örn. "Dogrulama Basarisiz. Sifre hatali." — gerçek bir yetkilendirme hatası.
    return false;
  }

   private handleMessage(raw: string): void {
    let parsed: MepsanResponse | MepsanEventEnvelope;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // JSON olmayan mesajı sessizce yok say
    }

    if ('type' in parsed && parsed.type === 'event') {
      this.eventListeners.forEach((listener) => listener(parsed as MepsanEventEnvelope));
      return;
    }

    // Broadcast değil — sıradaki bekleyen isteğin cevabı (FIFO).
    const pending = this.pendingQueue.shift();
    if (!pending) {
      return;
    }
    clearTimeout(pending.timeout);
    pending.resolve(parsed as MepsanResponse);
  }

  private rejectAllPending(reason: string): void {
    while (this.pendingQueue.length > 0) {
      const pending = this.pendingQueue.shift()!;
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }
  }

  private scheduleReconnect(): void {
    this.setState('RECONNECTING');
    const delay = reconnectDelayMs(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }
}
