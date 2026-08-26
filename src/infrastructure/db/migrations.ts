// src/infrastructure/db/migrations.ts
//
// Şema versiyon 1 -> 2: uygulama içi bildirim geçmişi için 'notifications'
// tablosu eklendi. Mevcut kurulu uygulamalarda cihazdaki eski (v1) veritabanı
// dosyası bu migration ile bozulmadan yeni tabloyu kazanır.

import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'notifications',
          columns: [
            { name: 'request_id', type: 'string', isIndexed: true },
            { name: 'title', type: 'string' },
            { name: 'body', type: 'string' },
            { name: 'is_read', type: 'boolean', isIndexed: true },
            { name: 'created_at', type: 'number', isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'notifications',
          columns: [{ name: 'user_id', type: 'string', isIndexed: true }],
        }),
      ],
    },
  ],
});