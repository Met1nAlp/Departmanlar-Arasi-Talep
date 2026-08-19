// src/mocks/requests.ts
import { Request } from '../types';

export const mockRequests: Request[] = [
  { id: 'r1', requesterId: 'user-saha_personeli', departmentId: 'dep-1', productId: 'p1', quantity: 3, status: 'TALEP_ALINDI', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r2', requesterId: 'user-saha_personeli', departmentId: 'dep-2', productId: 'p2', quantity: 1, status: 'YOLDA', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r3', requesterId: 'u2', departmentId: 'dep-1', productId: 'p3', quantity: 5, status: 'TESLIM_EDILDI', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
];