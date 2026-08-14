// src/mocks/users.ts
//
// Plan Bölüm 14.2 "İki katmanlı model": önce yetkili (supervisor) kullanıcı
// adı/şifre ile giriş yapar, sonra cihazdaki personel listesinden kendini
// seçip PIN girer. Bu dosya backend gelene kadar iki listeyi ayrı tutar:
//   - mockSupervisors: giriş yapabilen yetkililer (kullanıcı adı + şifre)
//   - mockStaffMembers: bir yetkilinin ekibindeki personel (PIN ile oturum açar)
//
// Mevcut prototipteki `mockUsers` (3 rol) personel listesine taşındı; ekranlar
// hâlâ aynı User tipini ve aynı legacy rolleri kullanıyor.

import { User } from '../types';

export const mockUsers: User[] = [
  { id: 'user-saha_personeli', name: 'Ahmet (Saha Personeli)', role: 'saha_personeli' },
  { id: 'user-departman_yetkilisi', name: 'Elif (Depo Departmanı)', role: 'departman_yetkilisi', departmentId: 'dep-1' },
  { id: 'user-yonetici', name: 'Mehmet (Yönetici)', role: 'yonetici' },
];

export interface SupervisorCredential {
  username: string;
  /** MOCK — düz metin. Backend'de Argon2id hash olacak (Plan Bölüm 14.3). */
  password: string;
  supervisorUser: User;
}

/** Vardiya amiri hesapları. Gerçek şifre yok — tek amiriyle demo yapılıyor. */
export const mockSupervisors: SupervisorCredential[] = [
  {
    username: 'kemal.t',
    password: 'mepsan123',
    supervisorUser: { id: 'user-supervisor-kemal', name: 'Kemal T. (Vardiya Amiri)', role: 'yonetici' },
  },
];

export interface StaffMember {
  user: User;
  /** MOCK — düz metin, 4-6 hane. Backend'de Argon2id hash olacak. */
  pin: string;
  supervisorUserId: string;
}

/** Bir amirin gözetimindeki personel — PIN ile oturum açarlar (Plan Bölüm 14.2). */
export const mockStaffMembers: StaffMember[] = [
  { user: mockUsers[0], pin: '1234', supervisorUserId: 'user-supervisor-kemal' },
  { user: mockUsers[1], pin: '2345', supervisorUserId: 'user-supervisor-kemal' },
  { user: mockUsers[2], pin: '3456', supervisorUserId: 'user-supervisor-kemal' },
];
