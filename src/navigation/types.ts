export type AuthStackParamList = {
  Login: undefined;
  PinSession: undefined;
};

export type SahaPersoneliStackParamList = {
  Home: undefined;
  DepartmentSelect: undefined;
  QRScan: { departmentId: string };
  RequestCreated: { requestId: string };
  RequestTracking: { requestId: string };
  DeliveryConfirm: { requestId: string };
};

export type DepartmanYetkilisiStackParamList = {
  IncomingRequests: undefined;
  RequestDetail: { requestId: string };
};

export type YoneticiStackParamList = {
  Dashboard: undefined;
  AllRequests: undefined;
  DepartmentReports: undefined;
  EscalationList: undefined;
  Settings: undefined;
};