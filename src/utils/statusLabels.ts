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

// İptal/red — lineer akışın (statusOrder) parçası DEĞİL, terminal durumlar.
// RequestStatusStrip gibi ilerleme çubukları sadece statusOrder'ı kullanmaya
// devam eder; bunlar StatusChip/StatusBadge'de gösterilmek için ayrı tutulur.
const terminalStatuses: RequestStatus[] = ['IPTAL_EDILDI', 'REDDEDILDI'];

// Artık statusTokens'tan türetiliyor — etiket tek yerde (colors.ts) tanımlı, burada tekrar edilmiyor
export const statusLabels: Record<RequestStatus, string> = Object.fromEntries(
  [...statusOrder, ...terminalStatuses].map((key) => [key, statusTokens[key].label])
) as Record<RequestStatus, string>;