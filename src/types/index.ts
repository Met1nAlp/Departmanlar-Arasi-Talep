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
  | 'KISMI_HAZIR'
  | 'YOLDA'
  | 'TESLIM_EDILDI'
  | 'IPTAL_EDILDI'
  | 'ESKALASYON';

export type Priority = 'NORMAL' | 'URGENT' | 'LINE_DOWN' | 'PLANNED';

export interface Request {
  id: string;
  requesterId: string;
  departmentId: string;
  productId: string;
  quantity: number;
  status: RequestStatus;
  priority?: Priority;
  fulfilledQuantity?: number;
  cancelReason?: string;
  deliveryMethod: 'elektrikli_transpalet';
  createdAt: string;
  preparedAt?: string;
  readyAt?: string;
  onTheWayAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}