import { MaterialRequest } from '../contracts/types';

// GEÇİCİ: Efe'nin E7 maddesi (gerçek veri erişim katmanı) gelene kadar
// çok satırlı talep akışını test edebilmek için. Gerçek contracts tiplerini
// kullanıyor — Efe'nin API'si gelince sadece bu dosyanın kaynağı değişecek,
// MaterialRequest şekli zaten doğru.
export const mockMaterialRequests: MaterialRequest[] = [];