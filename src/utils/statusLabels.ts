import { RequestStatus } from '../types';

export const statusLabels: Record<RequestStatus, string> = {
  TALEP_ALINDI: 'Talep Alındı',
  HAZIRLANIYOR: 'Hazırlanıyor',
  HAZIR: 'Hazır',
  KISMI_HAZIR: 'Kısmi Hazır',
  YOLDA: 'Yolda',
  TESLIM_EDILDI: 'Teslim Edildi',
  IPTAL_EDILDI: 'İptal Edildi',
  ESKALASYON: '⚠️ Eskalasyon',
};

// Ana akış: iptal ve eskalasyon bu sırada değil, ayrı ele alınır
export const statusOrder: RequestStatus[] = [
  'TALEP_ALINDI',
  'HAZIRLANIYOR',
  'HAZIR',
  'YOLDA',
  'TESLIM_EDILDI',
];

export const priorityLabels: Record<string, string> = {
  NORMAL: 'Normal',
  URGENT: '🔴 Acil',
  LINE_DOWN: '🚨 Hat Durdu',
  PLANNED: '📅 Planlı',
};

export const priorityColors: Record<string, string> = {
  NORMAL: '#0057B8',
  URGENT: '#E74C3C',
  LINE_DOWN: '#8E0000',
  PLANNED: '#2ECC71',
};