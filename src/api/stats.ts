// src/api/stats.ts
//
// Barış'ın sunucusunda ayrı bir istatistik komutu yok. Departman bazlı
// talep sayıları gerçek veriden (getRequests + getDepartments) client
// tarafında hesaplanıyor — mock veri tamamen kaldırıldı.
//
// NOT: getDashboardStats() diye ayrı bir fonksiyon kasıtlı olarak burada
// YOK — DashboardScreen.tsx zaten kendi ekranında getRequests({})'tan
// aynı türden istatistikleri (bugünkü talep, ort. hazırlama süresi vb.)
// doğrudan hesaplıyor, ikinci bir kaynağa gerek yok.

import { getRequests } from './requests';
import { getDepartments } from './departments';

export async function getDepartmentStats() {
  const [requests, departments] = await Promise.all([getRequests({}), getDepartments()]);
  return departments.map((dep) => ({
    name: dep.name,
    requestCount: requests.filter((r) => r.departmentId === dep.id).length,
  }));
}