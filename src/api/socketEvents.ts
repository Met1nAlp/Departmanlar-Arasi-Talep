// src/api/socketEvents.ts
// GEÇİCİ MOCK: Gerçek backend hazır olana kadar Socket.io yerine basit bir in-app event bus.
// Ekranların kullandığı arayüz (onRequestStatusChanged / offRequestStatusChanged) birebir aynı kalacak,
// backend hazır olunca içi socket.io-client ile değişecek — screens/ hiç dokunulmayacak.

import { Request } from '../types';

type Listener = (request: Request) => void;

const listeners = new Set<Listener>();

export function emitRequestStatusChanged(request: Request) {
  listeners.forEach((listener) => listener(request));
}

export function onRequestStatusChanged(listener: Listener) {
  listeners.add(listener);
}

export function offRequestStatusChanged(listener: Listener) {
  listeners.delete(listener);
}