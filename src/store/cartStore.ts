import { create } from 'zustand';

export interface CartLine {
  partId: string;
  partName: string;
  departmentId: string;
  qtyRequested: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (partId: string, partName: string, departmentId: string, qty?: number) => void;
  updateQty: (partId: string, qty: number) => void;
  removeLine: (partId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],

  addLine: (partId, partName, departmentId, qty = 1) =>
    set((state) => {
      const existing = state.lines.find((l) => l.partId === partId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.partId === partId ? { ...l, qtyRequested: l.qtyRequested + qty } : l
          ),
        };
      }
      return { lines: [...state.lines, { partId, partName, departmentId, qtyRequested: qty }] };
    }),

  updateQty: (partId, qty) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.partId === partId ? { ...l, qtyRequested: qty } : l)),
    })),

  removeLine: (partId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.partId !== partId) })),

  clear: () => set({ lines: [] }),
}));