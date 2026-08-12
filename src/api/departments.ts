// src/api/departments.ts
import { Department } from '../types';
import { mockDepartments } from '../mocks/departments';
import { delay } from './delay';

// Backend sözleşmesi: GET /departments
export async function getDepartments(): Promise<Department[]> {
  await delay();
  return mockDepartments;
}