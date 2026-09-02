// src/mocks/requests.ts
import { Request } from '../types';

export const mockRequests: Request[] = [
  { id: 'r1', requesterId: 'user-uretim_yoneticisi', departmentId: 'dep-1', productId: 'p1', quantity: 3, status: 'TALEP_ALINDI', priority: 'NORMAL', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r2', requesterId: 'user-uretim_yoneticisi', departmentId: 'dep-2', productId: 'p2', quantity: 1, status: 'YOLDA', priority: 'NORMAL', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r3', requesterId: 'u2', departmentId: 'dep-1', productId: 'p3', quantity: 5, status: 'TESLIM_EDILDI', priority: 'NORMAL', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
];