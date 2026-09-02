export type UserRole = 'uretim_yoneticisi' | 'departman_yetkilisi' | 'yonetici';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  pushToken?: string;
  cardUid?: string;
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
  | 'TESLIM_EDILDI'
  | 'IPTAL_EDILDI'
  | 'REDDEDILDI';

export interface Request {
  id: string;
  /** Aynı sepetten (siparişten) gelen eşyaları birbirine bağlar — bkz. api/requests.ts createOrder. */
  orderId?: string;
  requesterId: string;
  requesterName?: string;
  departmentId: string;
  productId: string;
  quantity: number;
  fulfilledQuantity?: number; 
  priority: 'ACIL' | 'NORMAL';
  status: RequestStatus;
  deliveryMethod: 'elektrikli_transpalet';
  createdAt: string;
  preparedAt?: string;
  readyAt?: string;
  onTheWayAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rejectedAt?: string;
  rejectReason?: string;
}