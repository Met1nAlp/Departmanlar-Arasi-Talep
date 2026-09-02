import { Product } from "../types";

export type AuthStackParamList = {
  Welcome: undefined;
  CardLogin: undefined;
  DeviceUnauthorized: undefined;
};

export type UretimYoneticisiStackParamList = {
  Home: undefined;
  ProductSearch: undefined;
  QRScan: { preselectedProduct?: Product };
  RequestCreated: {
    requestIds: string[];
    /** Departmana göre gruplanmış sepet özeti — özet ekranında departman bazlı gösterim için. */
    groups: { departmentId: string; items: { partId: string; partName: string; qty: number }[] }[];
  };
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