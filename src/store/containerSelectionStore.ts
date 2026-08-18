import { create } from 'zustand';

// requestId -> seçilen containerTypeId eşlemesi. ContainerSelectScreen'den
// PartialFulfillmentScreen'e veri taşımak için (ekranlar arası, navigation
// params yerine — cartStore'daki aynı desen).
interface ContainerSelectionState {
  selections: Record<string, string>;
  setSelection: (requestId: string, containerTypeId: string) => void;
}

export const useContainerSelectionStore = create<ContainerSelectionState>((set) => ({
  selections: {},
  setSelection: (requestId, containerTypeId) =>
    set((state) => ({ selections: { ...state.selections, [requestId]: containerTypeId } })),
}));