// src/infrastructure/realtime/RealtimeClient.ts
//
// Gerçek zaman istemcisi. Kaynak: MEPSAN_MTS_Proje_Plani.md Bölüm 9
// (Haberleşme Katmanı), özellikle 9.2 "Bağlantı yaşam döngüsü" sequence
// diyagramı ve "Kritik detaylar" listesi.
//
// Uygular:
//   - CONNECT + JWT ile bağlanma, connection.ack bekleme
//   - Kanallara abone olma (subscribe/subscribe.ack)
//   - 20 sn heartbeat (ping/pong) — fabrika NAT/firewall'ları uzun süre sessiz
//     TCP bağlantılarını düşürür (Bölüm 9.2)
//   - Reconnect backoff 1→2→4→8→15 sn + jitter (bkz. backoff.ts)
//   - lastSeq tabanlı replay — kaçırılan olaylar yeniden bağlanmada telafi edilir
//   - Gelen olayları 100 ms pencerede batch'leme (bkz. EventBatcher.ts, Plan 12.5)
//
// KULLANIM NOTU: Bu sınıf henüz hiçbir ekrana bağlanmadı. Backend WS ucu hazır
// olmadan bağlanmaya çalışmak anlamsız olacağı için `src/api/socketEvents.ts`
// (mevcut in-app mock event bus) şimdilik değiştirilmedi — o dosyanın kendi
// yorumu zaten "backend hazır olunca içi socket.io-client ile değişecek" diyor.
// Backend WS ucu netleşince yapılacak tek şey: socketEvents.ts içindeki
// emit/on fonksiyonlarını bu sınıfın instance'ına yönlendirmek.

import { io, type Socket } from 'socket.io-client';
import type { EventEnvelope } from '../../contracts/types';
import { reconnectDelayMs } from './backoff';
import { EventBatcher } from './EventBatcher';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface RealtimeClientOptions {
  url: string;
  /** JWT üretici — her (yeniden) bağlanmada çağrılır, token yenilenmiş olabilir. */
  getToken: () => Promise<string | null> | string | null;
  heartbeatIntervalMs?: number; // varsayılan 20_000 — Plan Bölüm 9.2
  batchWindowMs?: number; // varsayılan 100 — Plan Bölüm 12.5
}

const DEFAULT_HEARTBEAT_MS = 20_000;
const DEFAULT_BATCH_MS = 100;

export class RealtimeClient {
  private socket: Socket | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private lastSeq = 0;
  private reconnectAttempt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribedChannels: string[] = [];
  private readonly stateListeners = new Set<(s: ConnectionState) => void>();
  private readonly eventListeners = new Set<(events: EventEnvelope[]) => void>();
  private readonly batcher: EventBatcher<EventEnvelope>;
  private readonly heartbeatIntervalMs: number;

  constructor(private readonly options: RealtimeClientOptions) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS;
    this.batcher = new EventBatcher<EventEnvelope>(options.batchWindowMs ?? DEFAULT_BATCH_MS, (batch) =>
      this.eventListeners.forEach((l) => l(batch))
    );
  }

  getState(): ConnectionState {
    return this.state;
  }

  getLastSeq(): number {
    return this.lastSeq;
  }

  /** Bağlantı durumu değişimini dinle (UI'daki 🟢/🟡/🔴 göstergesi için — Plan Bölüm 9.2). */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  /** Gelen olayları 100 ms pencerede batch'lenmiş şekilde dinle. */
  onEvents(listener: (events: EventEnvelope[]) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribe(channels: string[]): void {
    this.subscribedChannels = channels;
    if (this.state === 'CONNECTED') {
      this.socket?.emit('subscribe', { channels, lastSeq: this.lastSeq });
    }
  }

  async connect(): Promise<void> {
    if (this.socket) return;
    this.setState(this.reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');

    const token = await this.options.getToken();
    // reconnection: false — kendi backoff mantığımızı kontrol ediyoruz (Plan Bölüm 9.2),
    // socket.io'nun kendi (farklı) reconnection stratejisiyle çakışmasın diye.
    this.socket = io(this.options.url, {
      auth: { token },
      reconnection: false,
      transports: ['websocket'],
    });
    this.wireHandlers(this.socket);
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.batcher.dispose();
    this.socket?.removeAllListeners();
    this.socket?.close();
    this.socket = null;
    this.reconnectAttempt = 0;
    this.setState('DISCONNECTED');
  }

  private wireHandlers(socket: Socket): void {
    socket.on('connect', () => {
      this.reconnectAttempt = 0;
      this.setState('CONNECTED');
      // CONNECT + JWT + lastSeq -> replay {events: [...]}  (Plan Bölüm 9.2)
      socket.emit('subscribe', { channels: this.subscribedChannels, lastSeq: this.lastSeq });
      this.startHeartbeat(socket);
    });

    socket.on('replay', (payload: { events: EventEnvelope[] }) => {
      for (const envelope of payload.events ?? []) this.handleIncomingEvent(envelope);
    });

    socket.on('event', (envelope: EventEnvelope) => {
      this.handleIncomingEvent(envelope);
      socket.emit('event.ack', { seq: envelope.seq });
    });

    socket.on('disconnect', () => {
      this.stopHeartbeat();
      this.socket = null;
      this.scheduleReconnect();
    });

    socket.on('connect_error', () => {
      socket.close();
      this.socket = null;
      this.scheduleReconnect();
    });
  }

  private handleIncomingEvent(envelope: EventEnvelope): void {
    // Idempotency: lastSeq'ten küçük/eşit olan olaylar zaten işlenmiştir (replay
    // sırasında tekrar gelebilir) — bu olmadan tedarikçi ekranında "hayalet
    // çağrı" oluşur (Plan Bölüm 9.2).
    if (envelope.seq <= this.lastSeq) return;
    this.lastSeq = envelope.seq;
    this.batcher.push(envelope);
  }

  private startHeartbeat(socket: Socket): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      socket.emit('ping', { seq: Date.now() });
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
      void this.connect();
    }, delay);
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.stateListeners.forEach((l) => l(next));
  }
}
