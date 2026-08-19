import { create } from 'zustand';

export interface CartLine {
  partId: string;
  partName: string;
  qtyRequested: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (partId: string, partName: string, qty?: number) => void;
  updateQty: (partId: string, qty: number) => void;
  removeLine: (partId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],

  addLine: (partId, partName, qty = 1) =>
    set((state) => {
      // Aynı ürün zaten sepette varsa, tekrar eklemek yerine adedini artır
      const existing = state.lines.find((l) => l.partId === partId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.partId === partId ? { ...l, qtyRequested: l.qtyRequested + qty } : l
          ),
        };
      }
      return { lines: [...state.lines, { partId, partName, qtyRequested: qty }] };
    }),

  updateQty: (partId, qty) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.partId === partId ? { ...l, qtyRequested: qty } : l)),
    })),

  removeLine: (partId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.partId !== partId) })),

  clear: () => set({ lines: [] }),
}));