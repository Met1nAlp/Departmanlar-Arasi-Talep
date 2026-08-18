export type UserRole = 'saha_personeli' | 'departman_yetkilisi' | 'yonetici';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId?: string; 
  pushToken?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  qrCode: string;
  departmentId: string;
}

export type RequestStatus =
  | 'TALEP_ALINDI'
  | 'HAZIRLANIYOR'
  | 'HAZIR'
  | 'YOLDA'
  | 'TESLIM_EDILDI';

export interface Request {
  id: string;
  requesterId: string;
  departmentId: string;
  productId: string;
  quantity: number;
  status: RequestStatus;
  deliveryMethod: 'elektrikli_transpalet';
  createdAt: string;
  preparedAt?: string;
  readyAt?: string;
  onTheWayAt?: string;
  deliveredAt?: string;
}