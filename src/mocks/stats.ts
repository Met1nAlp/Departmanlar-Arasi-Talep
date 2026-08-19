// src/mocks/stats.ts
//
// "Vardiya Özeti" mockup'ındaki 2x2 KPI kart grid'iyle birebir eşleşecek
// şekilde tanımlandı (bkz. screens/yonetici/DashboardScreen.tsx). `tone`
// alanı design-system state renklerinden hangisinin kullanılacağını belirtir
// — "Gecikmiş" gibi olumsuz metrikler danger, diğerleri pending/success olur.
export type DashboardStatTone = 'pending' | 'success' | 'danger' | 'neutral';

export interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  tone: DashboardStatTone;
}

export const mockDashboardStats: DashboardStat[] = [
  { label: 'Açık Talep', value: '24', icon: 'file-tray-full-outline', tone: 'pending' },
  { label: 'Ort. Karşılama', value: '18 dk', icon: 'time-outline', tone: 'neutral' },
  { label: 'SLA Uyumu', value: '%92', icon: 'checkmark-circle-outline', tone: 'success' },
  { label: 'Gecikmiş', value: '3', icon: 'alert-circle-outline', tone: 'danger' },
];

export const mockDepartmentStats = [
  { name: 'Depo', requestCount: 42 },
  { name: 'Bakım', requestCount: 17 },
  { name: 'Elektrik', requestCount: 9 },
];