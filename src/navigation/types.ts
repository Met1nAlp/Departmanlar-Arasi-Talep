import { Product } from "../types";

export type AuthStackParamList = {
  DeviceEnroll: undefined;
  Login: undefined;
  // İki katmanlı oturum (Plan Bölüm 14.2): yetkili girişinden sonra personel
  // PIN ekranı. AuthNavigator supervisor'a göre bu ikisinden birini gösterir.
  PinSession: undefined;
};

export type SahaPersoneliStackParamList = {
  Home: undefined;
  DepartmentSelect: undefined;
  ProductSearch: { departmentId: string };
  QRScan: { departmentId: string; preselectedProduct?: Product };
  RequestCreated: { requestId: string };
  RequestTracking: { requestId: string };
  DeliveryConfirm: { requestId: string };
  CancelRequest: { requestId: string };
  Settings: undefined;
  PartSearchForCart: undefined;
  CartQuantity: { productId: string; productName: string; qrCode: string };
  MaterialRequestCart: undefined;
};

export type DepartmanYetkilisiStackParamList = {
  IncomingRequests: undefined;
  RequestDetail: { requestId: string };
  RejectRequest: { requestId: string };
  Settings: undefined;
  MaterialRequestQueue: undefined;
  PartialFulfillment: { requestId: string };
  ContainerSelect: { requestId: string };
  SerialCapture: { lineId: string; qty: number; requestNo?: string; productName?: string };
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
