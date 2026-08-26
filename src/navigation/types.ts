import { Product } from "../types";

export type AuthStackParamList = {
  Welcome: undefined;
  CardLogin: undefined;
  DeviceUnauthorized: undefined;
};

export type SahaPersoneliStackParamList = {
  Home: undefined;
  DepartmentSelect: undefined;
  ProductSearch: { departmentId: string; priority: 'ACIL' | 'NORMAL' };
  QRScan: { departmentId: string; priority: 'ACIL' | 'NORMAL'; preselectedProduct?: Product };
  // Sepet mantığı: birden fazla ürün tek departmandan ayrı ayrı CREATE_REQUEST
  // olarak gönderilir (backend çok satırlı talep desteklemiyor). requestIds
  // her satırın kendi talep id'sini taşır.
  RequestCreated: { requestIds: string[] };
  RequestTracking: { requestId: string };
  DeliveryConfirm: { requestId: string };
  CancelRequest: { requestId: string };
  Settings: undefined;
  Notifications: undefined;
  
};

export type DepartmanYetkilisiStackParamList = {
  IncomingRequests: undefined;
  RequestDetail: { requestId: string };
  RejectRequest: { requestId: string };
  Settings: undefined;
  Notifications: undefined;
};

export type YoneticiStackParamList = {
  Dashboard: undefined;
  AllRequests: undefined;
  DepartmentReports: undefined;
  AuditTimeline: { requestId: string };
  EscalationList: undefined;
  ChangePriority: { requestId: string };
  Settings: undefined;
};
