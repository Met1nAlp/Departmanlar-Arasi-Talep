import { MaterialRequest, RequestLine } from '../contracts/types';
import { mockMaterialRequests } from '../mocks/materialRequests';
import { delay } from './delay';

// GEÇİCİ mock katman — Efe'nin E7 maddesi gerçek backend'e bağlanınca
// bu dosyanın İÇİ değişecek, fonksiyon imzaları (parametre/dönüş tipleri) aynı
// kalacak şekilde tasarlandı. Ekranlar bu yüzden dokunulmadan geçiş yapacak.

interface CreateMaterialRequestInput {
  requesterUserId: string;
  requesterDeptId: string;
  supplierDeptId: string;
  priority: MaterialRequest['priority'];
  deliveryLocationId?: string;
  note?: string;
  lines: Array<{ partId: string; qtyRequested: number }>;
}

export async function createMaterialRequest(input: CreateMaterialRequestInput): Promise<MaterialRequest> {
  await delay();

  const requestId = `mr-${Date.now()}`;
  const lines: RequestLine[] = input.lines.map((line, index) => ({
    id: `${requestId}-line-${index}`,
    requestId,
    partId: line.partId,
    qtyRequested: line.qtyRequested,
  }));

  const newRequest: MaterialRequest = {
    id: requestId,
    requestNo: `MR-${new Date().getFullYear()}-${String(mockMaterialRequests.length + 1).padStart(6, '0')}`,
    requesterUserId: input.requesterUserId,
    requesterDeptId: input.requesterDeptId,
    supplierDeptId: input.supplierDeptId,
    state: 'PENDING',
    priority: input.priority,
    deliveryLocationId: input.deliveryLocationId,
    lines,
    createdAt: new Date().toISOString(),
    clientRequestId: `${requestId}-idem`, // gerçek UUID v4, Efe'nin idempotency katmanı gelince
    note: input.note,
  };

  mockMaterialRequests.push(newRequest);
  return newRequest;
}

export async function getMaterialRequestById(id: string): Promise<MaterialRequest | undefined> {
  await delay();
  return mockMaterialRequests.find((r) => r.id === id);
}

export async function getMaterialRequestsBySupplierDept(deptId: string): Promise<MaterialRequest[]> {
  await delay();
  return mockMaterialRequests.filter((r) => r.supplierDeptId === deptId);
}

interface LinePreparation {
  lineId: string;
  qtyPrepared: number;
  shortageReason?: string;
  serials?: string[];
}

export async function submitPreparation(
  requestId: string,
  linePreparations: LinePreparation[],
  containerTypeId?: string
): Promise<MaterialRequest> {
  await delay();
  const request = mockMaterialRequests.find((r) => r.id === requestId);
  if (!request) throw new Error('Request not found');

  request.lines = request.lines.map((line) => {
    const prep = linePreparations.find((p) => p.lineId === line.id);
    if (!prep) return line;
    return {
      ...line,
      qtyPrepared: prep.qtyPrepared,
      shortageReason: prep.shortageReason,
      containerTypeId,
      serials: prep.serials?.map((serialNo, index) => ({
        id: `${line.id}-serial-${index}`,
        requestLineId: line.id,
        serialNo,
        scannedAt: new Date().toISOString(),
        scannedBy: 'current-user', // Efe'nin gerçek auth'u gelince actorUserId olacak
      })),
    };
  });

  // Tüm satırlar istenen adedin tamamını karşıladıysa READY_FOR_PICKUP,
  // en az biri eksikse PARTIALLY_READY (Plan Bölüm 7.1 durum makinesi).
  const allFullyMet = request.lines.every((l) => (l.qtyPrepared ?? 0) >= l.qtyRequested);
  request.state = allFullyMet ? 'READY_FOR_PICKUP' : 'PARTIALLY_READY';

  return request;
}