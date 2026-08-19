// src/api/stats.ts
import { mockDashboardStats, mockDepartmentStats } from '../mocks/stats';
import { delay } from './delay';

// Backend sözleşmesi: GET /stats/dashboard
export async function getDashboardStats() {
  await delay();
  return mockDashboardStats;
}

// Backend sözleşmesi: GET /stats/departments
export async function getDepartmentStats() {
  await delay();
  return mockDepartmentStats;
}