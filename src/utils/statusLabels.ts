import { RequestStatus } from '../types';

export const statusLabels: Record<RequestStatus, string> = {
  TALEP_ALINDI: 'Talep Alındı',
  HAZIRLANIYOR: 'Hazırlanıyor',
  HAZIR: 'Hazır',
  YOLDA: 'Yolda',
  TESLIM_EDILDI: 'Teslim Edildi',
};

export const statusOrder: RequestStatus[] = [
  'TALEP_ALINDI',
  'HAZIRLANIYOR',
  'HAZIR',
  'YOLDA',
  'TESLIM_EDILDI',
];