// src/infrastructure/db/index.ts
//
// Uygulama genelindeki TEK Database örneği (Plan Bölüm 12.3 klasör yapısı:
// infrastructure/db/). SQLiteAdapter native modül gerektirir — bu yüzden E3
// dev-client'a geçişi gerektirdi (bkz. görev notu, babel.config.js dosya
// başı yorumu). Expo Go'da bu dosya import edildiği an patlar; dev-client
// build'inde (expo run:android / EAS dev build) sorunsuz çalışır.

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { modelClasses } from './models';

const adapter = new SQLiteAdapter({
  schema,
  // migrations eklendiğinde buraya: migrations,
  jsi: true, // RN 0.86 + Hermes ile JSI adaptörü — senkron okuma, daha hızlı
  onSetUpError: (error) => {
    // Plan Bölüm 20 güvenilirlik hedefleri: veritabanı açılışta patlarsa
    // uygulama tamamen kullanılamaz hale gelir. Şimdilik konsola yazıyoruz;
    // Sentry entegrasyonu (Plan Bölüm 12.1 teknoloji seçimi) geldiğinde
    // buraya raporlama eklenecek.
    console.error('[db] SQLite adapter kurulamadı:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses,
});
