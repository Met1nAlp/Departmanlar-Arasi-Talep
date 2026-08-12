// src/hooks/useRequestUpdates.ts
import { useEffect } from 'react';
import { Request } from '../types';
import { onRequestStatusChanged, offRequestStatusChanged } from '../api/socketEvents';

/**
 * Bir talebin (ya da tüm taleplerin) durumu değiştiğinde tetiklenir.
 * filterId verilirse sadece o talebi dinler, verilmezse hepsini dinler.
 */
export function useRequestUpdates(onUpdate: (request: Request) => void, filterId?: string) {
  useEffect(() => {
    const listener = (request: Request) => {
      if (!filterId || request.id === filterId) onUpdate(request);
    };
    onRequestStatusChanged(listener);
    return () => offRequestStatusChanged(listener); // ekran kapanınca dinlemeyi bırak
  }, [filterId]);
}