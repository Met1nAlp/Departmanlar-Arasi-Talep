// src/infrastructure/realtime/RealtimeClient.ts
//
// Gerçek zaman istemcisi — Native WebSocket ile MepsanServer (C++ Qt) backend'ine bağlanır.
//
// Backend protokolü (serverhandler.cpp):
//   - Bağlantı: ws://HOST:PORT (raw WebSocket, NonSecureMode)
//   - Mesaj formatı: JSON string  →  { command: "...", mac_address: "...", ...alanlar }
//   - Yanıt formatı: JSON string  →  { status: "ok"|"error", message: "...", ...alanlar }
//
// Uygulama katmanı bu istemciyi doğrudan kullanmaz; `MepsanWebSocketService`
// (src/infrastructure/realtime/MepsanService.ts) üzerinden tipler güvenli
// `sendCommand` fonksiyonları çağırır.
//
// Uygular:
//   - Native WebSocket (socket.io DEĞİL — backend raw WS kabul eder)
//   - 20 sn heartbeat (TEST ping) — fabrika NAT/firewall'ları uzun süre sessiz
//     TCP bağlantılarını düşürür
//   - Reconnect backoff 1→2→4→8→15 sn + jitter
//   - ConnectionState → connectionStore üzerinden UI'a yansıtılır

import { reconnectDelayMs } from './backoff';
import { EventBatcher } from './EventBatcher';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

// Backend'den gelen JSON yanıt tipi
export interface ServerResponse {
  status: 'ok' | 'error' | 'hata';
  message: string;
  [key: string]: unknown;
}

// Backend'e gönderilen JSON komut tipi
export interface ServerCommand {
  command: string;
  mac_address: string;
  [key: string]: unknown;
}

export interface RealtimeClientOptions {
  url: string;
  /** Cihaz kimliği — her mesajda mac_address alanı olarak gönderilir. */
  getDeviceId: () => string;
  heartbeatIntervalMs?: number; // varsayılan 20_000
  batchWindowMs?: number;       // varsayılan 100
}

const DEFAULT_HEARTBEAT_MS = 20_000;
const DEFAULT_BATCH_MS = 100;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private reconnectAttempt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly stateListeners = new Set<(s: ConnectionState) => void>();
  private readonly messageListeners = new Set<(response: ServerResponse) => void>();
  private readonly batcher: EventBatcher<ServerResponse>;
  private readonly heartbeatIntervalMs: number;

  constructor(private readonly options: RealtimeClientOptions) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS;
    this.batcher = new EventBatcher<ServerResponse>(
      options.batchWindowMs ?? DEFAULT_BATCH_MS,
      (batch) => this.messageListeners.forEach((l) => l(batch[batch.length - 1]))
    );
  }

  getState(): ConnectionState {
    return this.state;
  }

  /** Bağlantı durumu değişimini dinle (UI'daki 🟢/🟡/🔴 göstergesi için). */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  /** Backend'den gelen mesajları dinle. */
  onMessage(listener: (response: ServerResponse) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  connect(): void {
    if (this.ws) return;
    this.setState(this.reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      this.ws = new WebSocket(this.options.url);
      this.wireHandlers(this.ws);
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.batcher.dispose();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempt = 0;
    this.setState('DISCONNECTED');
  }

  /**
   * Backend'e JSON komut gönder.
   * mac_address otomatik eklenir; sadece ek alanlar ve command verilir.
   */
  send(command: string, extra: Record<string, unknown> = {}): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    const payload: ServerCommand = {
      command,
      mac_address: this.options.getDeviceId(),
      ...extra,
    };
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  private wireHandlers(ws: WebSocket): void {
    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setState('CONNECTED');
      this.startHeartbeat();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const response = JSON.parse(event.data) as ServerResponse;
        this.batcher.push(response);
      } catch {
        // JSON parse hatası — sessizce geç
      }
    };

    ws.onerror = () => {
      // onclose her zaman onerror'dan sonra gelir; cleanup orada yapılır
    };

    ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      // Backend'e basit TEST komutu gönder (serverhandler.cpp satır 141)
      this.send('TEST');
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer != null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.setState('RECONNECTING');
    const delay = reconnectDelayMs(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.stateListeners.forEach((l) => l(next));
  }
}
