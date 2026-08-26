// src/api/departments.ts
import { Department } from '../types';
import { database } from '../infrastructure/db';
import DepartmentModel from '../infrastructure/db/models/Department';

export async function getDepartments(): Promise<Department[]> {
  const rows = await database.get<DepartmentModel>('departments').query().fetch();
  return rows.map((r) => ({ id: r.code, name: r.name }));
}