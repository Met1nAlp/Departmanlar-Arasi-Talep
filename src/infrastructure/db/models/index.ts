// src/infrastructure/db/models/index.ts
// Database constructor'a (bkz. ../index.ts) verilecek model sınıfı listesi.
import Part from './Part';
import PartBarcode from './PartBarcode';
import Department from './Department';
import Location from './Location';
import RequestCache from './RequestCache';
import OutboxRecord from './OutboxRecord';
import EventLogLocal from './EventLogLocal';
import KvStoreEntry from './KvStoreEntry';

export const modelClasses = [
  Part,
  PartBarcode,
  Department,
  Location,
  RequestCache,
  OutboxRecord,
  EventLogLocal,
  KvStoreEntry,
];

export { Part, PartBarcode, Department, Location, RequestCache, OutboxRecord, EventLogLocal, KvStoreEntry };
