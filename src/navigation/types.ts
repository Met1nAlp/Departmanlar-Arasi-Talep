import { Product } from "../types";

export type AuthStackParamList = {
  Welcome: undefined;
  CardLogin: undefined;
  DeviceUnauthorized: undefined;
};

export type SahaPersoneliStackParamList = {
  Home: undefined;
  ProductSearch: undefined;
  QRScan: { preselectedProduct?: Product };
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