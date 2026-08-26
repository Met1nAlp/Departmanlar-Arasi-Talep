// src/store/connectionStore.ts
import { create } from 'zustand';
import type { ConnectionState } from '../infrastructure/realtime/RealtimeClient';

export type DeviceAuthStatus = 'idle' | 'authorizing' | 'authorized' | 'unauthorized';

interface ConnectionStoreState {
  status: ConnectionState;
  pendingSyncCount: number;
  deviceAuthStatus: DeviceAuthStatus;
  setStatus: (status: ConnectionState) => void;
  setPendingSyncCount: (count: number) => void;
  setDeviceAuthStatus: (status: DeviceAuthStatus) => void;
}

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  status: 'DISCONNECTED',
  pendingSyncCount: 0,
  deviceAuthStatus: 'idle',
  setStatus: (status) => set({ status }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setDeviceAuthStatus: (deviceAuthStatus) => set({ deviceAuthStatus }),
}));