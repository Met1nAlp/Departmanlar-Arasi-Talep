// src/infrastructure/db/schema.ts
//
// Cihaz üzerindeki yerel WatermelonDB şeması. Kaynak: Plan Bölüm 10.3
// "Cihaz üzerindeki yerel şema" listesi birebir:
//   parts, part_barcodes, departments, locations, requests_cache, outbox,
//   event_log_local, kv_store
//
// BİLİNÇLİ BASİTLEŞTİRME: requests_cache, RequestLine[]'ı ayrı bir tabloya
// değil `lines_json` sütununa serileştirilmiş olarak tutar. Sunucudaki
// (Plan Bölüm 10.1) REQUEST_LINE tablosu normalize edilmiş olsa da, cihazda
// bir çağrının satırları neredeyse hiç bağımsız sorgulanmaz — her zaman
// çağrıyla birlikte okunur/yazılır. Ayrı tabloya bölmek senkronizasyon
// karmaşıklığını artırır, sorgu avantajı getirmez. Sunucu tarafı normalize
// kalır; yalnızca cihaz önbelleği bu şekilde basitleştirildi.
//
// Şema sürümü değiştiğinde migrations.ts'e bir migration eklenmeli
// (bkz. o dosyanın başındaki not).

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'parts',
      columns: [
        { name: 'part_no', type: 'string', isIndexed: true },
        { name: 'revision', type: 'string' },
        { name: 'description_tr', type: 'string' },
        { name: 'description_en', type: 'string', isOptional: true },
        { name: 'uom', type: 'string' },
        { name: 'serial_tracked', type: 'boolean' },
        { name: 'lot_tracked', type: 'boolean' },
        { name: 'min_stock', type: 'number' },
        { name: 'default_supplier_dept_id', type: 'string', isOptional: true },
        { name: 'attributes_json', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'part_barcodes',
      columns: [
        { name: 'part_id', type: 'string', isIndexed: true },
        { name: 'symbology', type: 'string' },
        { name: 'raw_value', type: 'string', isIndexed: true },
        { name: 'parsed_gtin', type: 'string', isOptional: true },
        { name: 'is_primary', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'departments',
      columns: [
        { name: 'code', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'parent_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'locations',
      columns: [
        { name: 'department_id', type: 'string', isIndexed: true },
        { name: 'code', type: 'string' },
        { name: 'kind', type: 'string' },
        { name: 'map_ref', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'requests_cache',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true }, // sunucu ataması sonrası dolar
        { name: 'request_no', type: 'string', isOptional: true },
        { name: 'requester_user_id', type: 'string' },
        { name: 'requester_dept_id', type: 'string', isIndexed: true },
        { name: 'supplier_dept_id', type: 'string', isIndexed: true },
        { name: 'state', type: 'string', isIndexed: true },
        { name: 'priority', type: 'string' },
        { name: 'delivery_location_id', type: 'string', isOptional: true },
        { name: 'lines_json', type: 'string' },
        { name: 'created_at_iso', type: 'string' },
        { name: 'sla_due_at_iso', type: 'string', isOptional: true },
        { name: 'closed_at_iso', type: 'string', isOptional: true },
        { name: 'client_request_id', type: 'string', isIndexed: true }, // idempotency (Plan §7.4)
        { name: 'note', type: 'string', isOptional: true },
        { name: 'transport_order_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'outbox',
      columns: [
        { name: 'client_request_id', type: 'string', isIndexed: true },
        { name: 'operation', type: 'string' },
        { name: 'target_id', type: 'string', isOptional: true },
        { name: 'payload_json', type: 'string' },
        { name: 'attempts', type: 'number' },
        { name: 'next_attempt_at', type: 'number', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'last_error_json', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'event_log_local',
      columns: [
        { name: 'seq', type: 'number', isIndexed: true }, // RealtimeClient.lastSeq ile aynı sayaç (Plan §9.2)
        { name: 'request_id', type: 'string', isIndexed: true },
        { name: 'event_type', type: 'string' },
        { name: 'from_state', type: 'string', isOptional: true },
        { name: 'to_state', type: 'string' },
        { name: 'actor_user_id', type: 'string', isOptional: true },
        { name: 'device_id', type: 'string', isOptional: true },
        { name: 'payload_json', type: 'string', isOptional: true },
        { name: 'occurred_at_iso', type: 'string' },
      ],
    }),
        tableSchema({
      name: 'kv_store',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'request_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'is_read', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
      ],
    }),
  ],
});
