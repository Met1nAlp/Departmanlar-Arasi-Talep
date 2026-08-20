#include "databasemanager.h"
#include <QDebug>
#include <QSqlError>
#include <QSqlQuery>

databasemanager::databasemanager() {}

// Envantere kaydetme
bool databasemanager::connectToDatabase() {
  db = QSqlDatabase::addDatabase("QSQLITE");
  db.setDatabaseName("mepsan_envanter.db");

  if (!db.open()) {
    qDebug() << "[DB HATA] Veritabani acilamadi." << db.lastError().text();
    return false;
  }

  // SQL Verileri
  QSqlQuery query;
  query.exec("CREATE TABLE IF NOT EXISTS pos_devices ("
             "id INTEGER PRIMARY KEY AUTOINCREMENT, "
             "mac_address TEXT UNIQUE, "
             "device_id TEXT, "
             "last_ip TEXT, "
             "last_user TEXT, "
             "last_action, "
             "created_at DATETIME DEFAULT (datetime('now', 'localtime')), "
             "last_seen_at DATETIME DEFAULT (datetime('now', 'localtime')))");

  query.exec("CREATE TABLE IF NOT EXISTS requests ("
             "id TEXT PRIMARY KEY, "
             "requester_id TEXT, "
             "department_id TEXT, "
             "product_id TEXT, "
             "quantity INTEGER, "
             "status TEXT DEFAULT 'TALEP_ALINDI', "
             "priority TEXT DEFAULT 'NORMAL', "
             "fulfilled_quantity INTEGER DEFAULT 0, "
             "cancel_reason TEXT, "
             "escalated INTEGER DEFAULT 0, "
             "created_at TEXT, "
             "prepared_at TEXT, "
             "ready_at TEXT, "
             "on_the_way_at TEXT, "
             "delivered_at TEXT, "
             "cancelled_at TEXT)");

  // Mevcut veritabani dosyasindan onceki versiyonlarda sütunlar yoksa ekle
  query.exec("ALTER TABLE requests ADD COLUMN priority TEXT DEFAULT 'NORMAL'");
  query.exec(
      "ALTER TABLE requests ADD COLUMN fulfilled_quantity INTEGER DEFAULT 0");
  query.exec("ALTER TABLE requests ADD COLUMN cancel_reason TEXT");
  query.exec("ALTER TABLE requests ADD COLUMN escalated INTEGER DEFAULT 0");
  query.exec("ALTER TABLE requests ADD COLUMN cancelled_at TEXT");
  // ALTER TABLE hata verirse (sütun zaten varsa) SQLite sessizce geçer — sorun
  // yok

  qDebug() << "[DB] SQLite Veritabanina baglanildi. Sistem hazir.";
  return true;
}

bool databasemanager::updateLastAction(const QString &macAddress,
                                       const QString &actionDetails) {
  QSqlQuery query;
  query.prepare("UPDATE pos_devices SET last_seen_at = datetime('now', "
                "'localtime'), last_action = :act WHERE mac_address = :mac");
  query.bindValue(":act", actionDetails);
  query.bindValue(":mac", macAddress.trimmed());

  if (query.exec()) {
    qDebug() << "[DB] En Son -> MAC:" << macAddress
             << "| Aksiyon:" << actionDetails;
    return true;
  }

  qDebug() << "[DB] HATA: En son aksiyon guncellenemedi."
           << query.lastError().text();
  return false;
}

// MAC kontrolü
bool databasemanager::isMacAuthorized(const QString &macAddress) {
  QSqlQuery query;
  query.prepare("SELECT mac_address FROM pos_devices WHERE mac_address = :mac");
  query.bindValue(":mac", macAddress);

  if (query.exec() && query.next()) {
    return true;
  }
  return false;
}

bool databasemanager::authorizeMac(const QString &macAddress,
                                   const QString &deviceId,
                                   const QString &ipAddress,
                                   const QString &username) {
  QSqlQuery query;
  query.prepare("INSERT INTO pos_devices (mac_address, device_id, last_ip, "
                "last_user) VALUES (:mac, :dev, :ip, :usr)");
  query.bindValue(":mac", macAddress);
  query.bindValue(":dev", deviceId);
  query.bindValue(":ip", ipAddress);
  query.bindValue(":usr", username);

  if (query.exec()) {
    qDebug() << "[AUTH] Yeni cihaz kalici olarak veritabanina kaydedildi."
             << macAddress;
    return true;
  }

  qDebug() << "[AUTH] HATA: Cihaz kaydedilemedi." << query.lastError().text();
  return false;
}

// En son görülme
bool databasemanager::updateLastSeen(const QString &macAddress) {
  QSqlQuery query;
  query.prepare("UPDATE pos_devices SET last_seen_at = datetime('now', "
                "'localtime') WHERE mac_address = :mac");
  query.bindValue(":mac", macAddress);

  return query.exec();
}

bool databasemanager::createRequest(
    const QString &id, const QString &requesterId, const QString &departmentId,
    const QString &productId, int quantity, const QString &status,
    const QString &createdAt, const QString &priority) {
  QSqlQuery query;
  query.prepare("INSERT INTO requests (id, requester_id, department_id, "
                "product_id, quantity, status, priority, created_at) "
                "VALUES (:id, :reqId, :depId, :prodId, :qty, :status, "
                ":priority, :createdAt)");
  query.bindValue(":id", id);
  query.bindValue(":reqId", requesterId);
  query.bindValue(":depId", departmentId);
  query.bindValue(":prodId", productId);
  query.bindValue(":qty", quantity);
  query.bindValue(":status", status);
  query.bindValue(":priority", priority.isEmpty() ? "NORMAL" : priority);
  query.bindValue(":createdAt", createdAt);

  if (query.exec()) {
    qDebug() << "[DB] Yeni talep olusturuldu:" << id
             << "| Oncelik:" << priority;
    return true;
  }
  qDebug() << "[DB] HATA: Talep olusturulamadi." << query.lastError().text();
  return false;
}

QJsonArray databasemanager::getRequests(const QString &userId,
                                        const QString &departmentId) {
  QJsonArray requestsArray;
  QSqlQuery query;
  QString sql = "SELECT * FROM requests WHERE 1=1";

  if (!userId.isEmpty()) {
    sql += " AND requester_id = :userId";
  }
  if (!departmentId.isEmpty()) {
    sql += " AND department_id = :depId";
  }

  query.prepare(sql);
  if (!userId.isEmpty())
    query.bindValue(":userId", userId);
  if (!departmentId.isEmpty())
    query.bindValue(":depId", departmentId);

  if (query.exec()) {
    while (query.next()) {
      QJsonObject req;
      req["id"] = query.value("id").toString();
      req["requesterId"] = query.value("requester_id").toString();
      req["departmentId"] = query.value("department_id").toString();
      req["productId"] = query.value("product_id").toString();
      req["quantity"] = query.value("quantity").toInt();
      req["status"] = query.value("status").toString();
      req["priority"] = query.value("priority").toString();
      req["fulfilledQuantity"] = query.value("fulfilled_quantity").toInt();
      req["cancelReason"] = query.value("cancel_reason").toString();
      req["escalated"] = query.value("escalated").toInt() == 1;
      req["createdAt"] = query.value("created_at").toString();
      req["preparedAt"] = query.value("prepared_at").toString();
      req["readyAt"] = query.value("ready_at").toString();
      req["onTheWayAt"] = query.value("on_the_way_at").toString();
      req["deliveredAt"] = query.value("delivered_at").toString();
      req["cancelledAt"] = query.value("cancelled_at").toString();

      requestsArray.append(req);
    }
  } else {
    qDebug() << "[DB] HATA: Talepler getirilemedi." << query.lastError().text();
  }
  return requestsArray;
}

bool databasemanager::updateRequestStatus(const QString &id,
                                          const QString &status,
                                          const QString &timestampField,
                                          const QString &timestampValue) {
  QSqlQuery query;
  QString sql = "UPDATE requests SET status = :status";
  if (!timestampField.isEmpty() && !timestampValue.isEmpty()) {
    sql += ", " + timestampField + " = :tsValue";
  }
  sql += " WHERE id = :id";

  query.prepare(sql);
  query.bindValue(":status", status);
  if (!timestampField.isEmpty() && !timestampValue.isEmpty()) {
    query.bindValue(":tsValue", timestampValue);
  }
  query.bindValue(":id", id);

  if (query.exec()) {
    qDebug() << "[DB] Talep durumu guncellendi:" << id << "->" << status;
    return true;
  }
  qDebug() << "[DB] HATA: Talep durumu guncellenemedi."
           << query.lastError().text();
  return false;
}

// Talep iptal etme
bool databasemanager::cancelRequest(const QString &id,
                                    const QString &cancelReason,
                                    const QString &cancelledAt) {
  QSqlQuery query;
  query.prepare(
      "UPDATE requests SET status = 'IPTAL_EDILDI', cancel_reason = :reason, "
      "cancelled_at = :cancelledAt "
      "WHERE id = :id AND status NOT IN ('TESLIM_EDILDI', 'IPTAL_EDILDI')");
  query.bindValue(":reason", cancelReason);
  query.bindValue(":cancelledAt", cancelledAt);
  query.bindValue(":id", id);

  if (query.exec() && query.numRowsAffected() > 0) {
    qDebug() << "[DB] Talep iptal edildi:" << id << "| Neden:" << cancelReason;
    return true;
  }
  qDebug() << "[DB] HATA: Talep iptal edilemedi (zaten teslim/iptal veya "
              "bulunamadi)."
           << query.lastError().text();
  return false;
}

// Oncelik guncelleme
bool databasemanager::updatePriority(const QString &id,
                                     const QString &priority) {
  QSqlQuery query;
  query.prepare("UPDATE requests SET priority = :priority WHERE id = :id");
  query.bindValue(":priority", priority);
  query.bindValue(":id", id);

  if (query.exec()) {
    qDebug() << "[DB] Talep onceligi guncellendi:" << id << "->" << priority;
    return true;
  }
  qDebug() << "[DB] HATA: Oncelik guncellenemedi." << query.lastError().text();
  return false;
}

// Kismi veya tam karsilama
bool databasemanager::fulfillRequest(const QString &id, int fulfilledQuantity,
                                     const QString &newStatus,
                                     const QString &readyAt) {
  QSqlQuery query;
  query.prepare("UPDATE requests SET fulfilled_quantity = :qty, status = "
                ":status, ready_at = :readyAt WHERE id = :id");
  query.bindValue(":qty", fulfilledQuantity);
  query.bindValue(":status", newStatus);
  query.bindValue(":readyAt", readyAt);
  query.bindValue(":id", id);

  if (query.exec()) {
    qDebug() << "[DB] Talep karsilandi:" << id
             << "| Miktar:" << fulfilledQuantity << "| Durum:" << newStatus;
    return true;
  }
  qDebug() << "[DB] HATA: Karsilama guncellenemedi."
           << query.lastError().text();
  return false;
}

// Eskalasyon isaretle (SLA asimi)
bool databasemanager::escalateRequest(const QString &id) {
  QSqlQuery query;
  query.prepare(
      "UPDATE requests SET escalated = 1, status = 'ESKALASYON' "
      "WHERE id = :id AND status NOT IN ('IPTAL_EDILDI', 'TESLIM_EDILDI')");
  query.bindValue(":id", id);

  if (query.exec()) {
    qDebug() << "[DB] Talep eskalasyona alindi:" << id;
    return true;
  }
  qDebug() << "[DB] HATA: Eskalasyon isareti konulamadi."
           << query.lastError().text();
  return false;
}

// Eskalasyon listesi
QJsonArray databasemanager::getEscalatedRequests() {
  QJsonArray requestsArray;
  QSqlQuery query;
  query.prepare("SELECT * FROM requests WHERE escalated = 1 OR status = "
                "'ESKALASYON' ORDER BY created_at ASC");

  if (query.exec()) {
    while (query.next()) {
      QJsonObject req;
      req["id"] = query.value("id").toString();
      req["requesterId"] = query.value("requester_id").toString();
      req["departmentId"] = query.value("department_id").toString();
      req["productId"] = query.value("product_id").toString();
      req["quantity"] = query.value("quantity").toInt();
      req["status"] = query.value("status").toString();
      req["priority"] = query.value("priority").toString();
      req["fulfilledQuantity"] = query.value("fulfilled_quantity").toInt();
      req["escalated"] = true;
      req["createdAt"] = query.value("created_at").toString();
      requestsArray.append(req);
    }
  }
  return requestsArray;
}
