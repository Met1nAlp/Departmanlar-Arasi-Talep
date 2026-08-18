import { create } from 'zustand';

// lineId -> toplanan seri numaraları listesi.
interface SerialCaptureState {
  serialsByLine: Record<string, string[]>;
  setSerials: (lineId: string, serials: string[]) => void;
  clearLine: (lineId: string) => void;
}

export const useSerialCaptureStore = create<SerialCaptureState>((set) => ({
  serialsByLine: {},
  setSerials: (lineId, serials) =>
    set((state) => ({ serialsByLine: { ...state.serialsByLine, [lineId]: serials } })),
  clearLine: (lineId) =>
    set((state) => {
      const next = { ...state.serialsByLine };
      delete next[lineId];
      return { serialsByLine: next };
    }),
}));