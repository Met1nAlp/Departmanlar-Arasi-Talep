// src/mocks/deviceEnrollCodes.ts
//
// Plan Bölüm 14.2 adım 1 "Cihaz kaydı (bir kez, kurulumda)": POST
// /auth/device/enroll {deviceUid, enrollCode} → {deviceToken, departmentId, mode}.
// Gerçek backend bu kodları admin panelinden üretecek (Plan Bölüm 18.2 MDM);
// şimdilik BT/admin'in cihaza kurulum sırasında gireceği sabit kodlar.

import type { Device } from '../contracts/types';

export interface DeviceEnrollCode {
  code: string;
  departmentId: string;
  mode: Device['mode'];
}

export const mockDeviceEnrollCodes: DeviceEnrollCode[] = [
  { code: 'MONTAJ1-001', departmentId: 'd-montaj-1', mode: 'REQUESTER' },
  { code: 'ARAAMBAR-001', departmentId: 'd-ara-ambar', mode: 'SUPPLIER' },
  { code: 'DUAL-DEMO', departmentId: 'd-montaj-1', mode: 'DUAL' },
];
