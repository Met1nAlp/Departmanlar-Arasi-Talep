// src/utils/statusLabels.ts
import { statusTokens } from '../design-system/tokens';
import { RequestStatus } from '../types';

export const statusOrder: RequestStatus[] = [
  'TALEP_ALINDI',
  'HAZIRLANIYOR',
  'HAZIR',
  'YOLDA',
  'TESLIM_EDILDI',
];

// Artık statusTokens'tan türetiliyor — etiket tek yerde (colors.ts) tanımlı, burada tekrar edilmiyor
export const statusLabels: Record<RequestStatus, string> = Object.fromEntries(
  statusOrder.map((key) => [key, statusTokens[key].label])
) as Record<RequestStatus, string>;