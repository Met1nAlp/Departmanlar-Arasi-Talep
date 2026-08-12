// src/mocks/users.ts
import { User } from '../types';

export const mockUsers: User[] = [
  { id: 'user-saha_personeli', name: 'Ahmet (Saha Personeli)', role: 'saha_personeli' },
  { id: 'user-departman_yetkilisi', name: 'Elif (Depo Departmanı)', role: 'departman_yetkilisi', departmentId: 'dep-1' },
  { id: 'user-yonetici', name: 'Mehmet (Yönetici)', role: 'yonetici' },
];