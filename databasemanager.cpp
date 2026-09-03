#include "databasemanager.h"
#include <QDebug>
#include <QSqlError>
#include <QSqlQuery>
#include <QCoreApplication>
#include <QJsonDocument>

databasemanager::databasemanager() {}

bool databasemanager::connectToDatabase() {
    if (QSqlDatabase::contains(QSqlDatabase::defaultConnection)) {
        db = QSqlDatabase::database(QSqlDatabase::defaultConnection);
    } else {
        db = QSqlDatabase::addDatabase("QSQLITE");
        QString dbPath = QCoreApplication::applicationDirPath() + "/mepsan_envanter.db";
        db.setDatabaseName(dbPath);
    }

    if (!db.isOpen() && !db.open()) {
        qDebug() << "[DB HATA] Veritabani acilamadi:" << db.lastError().text();
        return false;
    }

    QSqlQuery query;
    query.exec("PRAGMA journal_mode = WAL;");
    query.exec("PRAGMA busy_timeout = 5000;");

    query.exec("CREATE TABLE IF NOT EXISTS pending_personnel (nfc_uid TEXT PRIMARY KEY, name TEXT, last_scanned_at DATETIME DEFAULT (datetime('now', 'localtime')))");
    query.exec("CREATE TABLE IF NOT EXISTS personnel (id INTEGER PRIMARY KEY AUTOINCREMENT, nfc_uid TEXT UNIQUE, name TEXT NOT NULL, department TEXT, role TEXT DEFAULT 'uretim_yoneticisi', created_at DATETIME DEFAULT (datetime('now', 'localtime')))");
    query.exec("CREATE TABLE IF NOT EXISTS pos_devices (id INTEGER PRIMARY KEY AUTOINCREMENT, serial_number TEXT UNIQUE, device_name TEXT, last_ip TEXT, last_user TEXT, last_action TEXT, created_at DATETIME DEFAULT (datetime('now', 'localtime')), last_seen_at DATETIME DEFAULT (datetime('now', 'localtime')))");
    query.exec("CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, requester_id TEXT, department_id TEXT, status TEXT DEFAULT 'TALEP_ALINDI', cancel_reason TEXT, created_at TEXT, cancelled_at TEXT)");
    query.exec("CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, product_id TEXT, quantity INTEGER, status TEXT DEFAULT 'BEKLIYOR')");

    qDebug() << "[DB] SQLite Veritabanina baglanildi. Sistem hazir.";
    return true;
}

bool databasemanager::isDeviceAuthorized(const QString &serialNumber) {
  QSqlQuery query;
  query.prepare("SELECT serial_number FROM pos_devices WHERE UPPER(serial_number) = UPPER(:sn)");
  query.bindValue(":sn", serialNumber.trimmed());
  return query.exec() && query.next();
}

bool databasemanager::addToWhitelist(const QString &serialNumber, const QString &deviceName) {
  QSqlQuery query;
  query.prepare("INSERT OR IGNORE INTO pos_devices (serial_number, device_name) VALUES (:sn, :name)");
  query.bindValue(":sn", serialNumber.trimmed().toUpper());
  query.bindValue(":name", deviceName.trimmed());
  return query.exec();
}

QJsonArray databasemanager::getAllDevices() {
  QJsonArray arr;
  QSqlQuery query("SELECT serial_number, device_name, last_ip, last_user, last_action, last_seen_at FROM pos_devices ORDER BY created_at DESC");
  while (query.next()) {
    QJsonObject obj;
    obj["serial_number"]  = query.value("serial_number").toString();
    obj["device_name"]    = query.value("device_name").toString();
    obj["last_ip"]        = query.value("last_ip").toString();
    obj["last_user"]      = query.value("last_user").toString();
    obj["last_action"]    = query.value("last_action").toString();
    obj["last_seen_at"]   = query.value("last_seen_at").toString();
    arr.append(obj);
  }
  return arr;
}

bool databasemanager::removeDevice(const QString &serialNumber) {
  QSqlQuery query;
  query.prepare("DELETE FROM pos_devices WHERE UPPER(serial_number) = UPPER(:sn)");
  query.bindValue(":sn", serialNumber.trimmed());
  return query.exec();
}

bool databasemanager::updateLastSeen(const QString &serialNumber, const QString &ipAddress) {
  QSqlQuery query;
  if (!ipAddress.isEmpty()) {
    query.prepare("UPDATE pos_devices SET last_seen_at = datetime('now', 'localtime'), last_ip = :ip WHERE UPPER(serial_number) = UPPER(:sn)");
    query.bindValue(":ip", ipAddress);
  } else {
    query.prepare("UPDATE pos_devices SET last_seen_at = datetime('now', 'localtime') WHERE UPPER(serial_number) = UPPER(:sn)");
  }
  query.bindValue(":sn", serialNumber.trimmed());
  return query.exec();
}

bool databasemanager::updateLastUser(const QString &serialNumber, const QString &username) {
  QSqlQuery query;
  query.prepare("UPDATE pos_devices SET last_user = :usr, last_seen_at = datetime('now', 'localtime') WHERE UPPER(serial_number) = UPPER(:sn)");
  query.bindValue(":usr", username.trimmed());
  query.bindValue(":sn", serialNumber.trimmed());
  return query.exec();
}

bool databasemanager::updateLastAction(const QString &serialNumber, const QString &actionDetails) {
  QSqlQuery query;
  query.prepare("UPDATE pos_devices SET last_seen_at = datetime('now', 'localtime'), last_action = :act WHERE UPPER(serial_number) = UPPER(:sn)");
  query.bindValue(":act", actionDetails);
  query.bindValue(":sn", serialNumber.trimmed());
  return query.exec();
}

bool databasemanager::createOrder(const QString &orderId, const QString &requesterId, const QString &departmentId, const QJsonArray &items, const QString &status, const QString &createdAt) {
  db.transaction();
  QSqlQuery query;
  query.prepare("INSERT INTO requests (id, requester_id, department_id, status, created_at) VALUES (:id, :reqId, :depId, :status, :createdAt)");
  query.bindValue(":id", orderId);
  query.bindValue(":reqId", requesterId);
  query.bindValue(":depId", departmentId);
  query.bindValue(":status", status);
  query.bindValue(":createdAt", createdAt);

  if (!query.exec()) {
      db.rollback();
      return false;
  }

  for (const QJsonValue &itemVal : items) {
      QJsonObject itemObj = itemVal.toObject();
      QSqlQuery itemQuery;
      itemQuery.prepare("INSERT INTO order_items (order_id, product_id, quantity) VALUES (:oid, :pid, :qty)");
      itemQuery.bindValue(":oid", orderId);
      itemQuery.bindValue(":pid", itemObj["product_id"].toString());
      itemQuery.bindValue(":qty", itemObj["qty"].toInt());
      if(!itemQuery.exec()) {
          db.rollback();
          return false;
      }
  }

  db.commit();
  return true;
}

QJsonArray databasemanager::getRequests(const QString &userId, const QString &departmentId) {
  QJsonArray requestsArray;
  QSqlQuery query("SELECT * FROM requests ORDER BY created_at DESC");

  while (query.next()) {
    QJsonObject req;
    QString orderId = query.value("id").toString();
    req["id"] = orderId;

    QString reqId = query.value("requester_id").toString();
    req["requesterId"] = reqId;
    req["requesterName"] = getPersonnelName(reqId).isEmpty() ? reqId : getPersonnelName(reqId);

    req["departmentId"] = query.value("department_id").toString();
    req["status"] = query.value("status").toString();
    req["createdAt"] = query.value("created_at").toString();

    QJsonArray itemsArray;
    QSqlQuery itemQuery;
    itemQuery.prepare("SELECT product_id, quantity, status FROM order_items WHERE order_id = :oid");
    itemQuery.bindValue(":oid", orderId);
    if(itemQuery.exec()) {
        while(itemQuery.next()) {
            QJsonObject itm;
            itm["product_id"] = itemQuery.value("product_id").toString();
            itm["qty"] = itemQuery.value("quantity").toInt();
            itm["status"] = itemQuery.value("status").toString();
            itemsArray.append(itm);
        }
    }
    req["items"] = itemsArray;

    if(itemsArray.size() > 0) {
        req["productId"] = itemsArray[0].toObject()["product_id"].toString();
        req["quantity"] = itemsArray[0].toObject()["qty"].toInt();
    }

    requestsArray.append(req);
  }
  return requestsArray;
}

bool databasemanager::updateRequestStatus(const QString &id, const QString &status, const QString &timestampField, const QString &timestampValue) {
  QSqlQuery query;
  query.prepare("UPDATE requests SET status = :status WHERE id = :id");
  query.bindValue(":status", status);
  query.bindValue(":id", id);
  return query.exec();
}

bool databasemanager::cancelRequest(const QString &id, const QString &cancelReason, const QString &cancelledAt, bool &wasPreparing) {
  QSqlQuery checkQuery;
  checkQuery.prepare("SELECT status FROM requests WHERE id = :id");
  checkQuery.bindValue(":id", id);
  if(checkQuery.exec() && checkQuery.next()) {
      wasPreparing = (checkQuery.value("status").toString() == "HAZIRLANIYOR");
  }

  QSqlQuery query;
  query.prepare("UPDATE requests SET status = 'IPTAL_EDILDI', cancel_reason = :reason, cancelled_at = :cancelledAt WHERE id = :id");
  query.bindValue(":reason", cancelReason);
  query.bindValue(":cancelledAt", cancelledAt);
  query.bindValue(":id", id);

  return query.exec() && query.numRowsAffected() > 0;
}

bool databasemanager::deleteRequest(const QString &reqId, bool &wasPreparing) {
    QSqlQuery checkQuery;
    checkQuery.prepare("SELECT status FROM requests WHERE id = :id");
    checkQuery.bindValue(":id", reqId);
    if(checkQuery.exec() && checkQuery.next()) {
        wasPreparing = (checkQuery.value("status").toString() == "HAZIRLANIYOR");
    }

    db.transaction();
    QSqlQuery query1, query2;
    query1.prepare("DELETE FROM requests WHERE id = :id");
    query1.bindValue(":id", reqId);
    query2.prepare("DELETE FROM order_items WHERE order_id = :id");
    query2.bindValue(":id", reqId);

    if(query1.exec() && query2.exec()) {
        db.commit();
        return true;
    }
    db.rollback();
    return false;
}

bool databasemanager::addPendingCard(const QString &nfcUid, const QString &name) {
    QSqlQuery query;
    query.prepare("INSERT INTO pending_personnel (nfc_uid, name, last_scanned_at) VALUES (:nfc, :name, datetime('now', 'localtime')) ON CONFLICT(nfc_uid) DO UPDATE SET last_scanned_at = datetime('now', 'localtime')");
    query.bindValue(":nfc", nfcUid.trimmed().toUpper());
    query.bindValue(":name", name.trimmed());
    return query.exec();
}

bool databasemanager::removePendingCard(const QString &nfcUid) {
    QSqlQuery query;
    query.prepare("DELETE FROM pending_personnel WHERE UPPER(nfc_uid) = UPPER(:nfc)");
    query.bindValue(":nfc", nfcUid.trimmed());
    return query.exec();
}

QJsonArray databasemanager::getPendingCards() {
    QJsonArray arr;
    QSqlQuery query("SELECT nfc_uid, name, last_scanned_at FROM pending_personnel ORDER BY last_scanned_at DESC");
    while (query.next()) {
      QJsonObject obj;
      obj["nfc_uid"] = query.value("nfc_uid").toString();
      obj["name"] = query.value("name").toString();
      obj["last_scanned_at"] = query.value("last_scanned_at").toString();
      arr.append(obj);
    }
    return arr;
}

bool databasemanager::addPersonnel(const QString &nfcUid, const QString &name, const QString &department, const QString &role) {
  QSqlQuery query;
  query.prepare("INSERT INTO personnel (nfc_uid, name, department, role) VALUES (:nfc, :name, :dep, :role)");
  query.bindValue(":nfc", nfcUid.trimmed().toUpper());
  query.bindValue(":name", name.trimmed());
  query.bindValue(":dep", department.trimmed());
  query.bindValue(":role", role.isEmpty() ? "uretim_yoneticisi" : role.trimmed());
  return query.exec();
}

bool databasemanager::removePersonnel(int id) {
  QSqlQuery query;
  query.prepare("DELETE FROM personnel WHERE id = :id");
  query.bindValue(":id", id);
  return query.exec();
}

bool databasemanager::updatePersonnel(int id, const QString &nfcUid, const QString &name, const QString &department, const QString &role) {
  QSqlQuery query;
  query.prepare("UPDATE personnel SET nfc_uid = :nfc, name = :name, department = :dep, role = :role WHERE id = :id");
  query.bindValue(":nfc",  nfcUid.trimmed().toUpper());
  query.bindValue(":name", name.trimmed());
  query.bindValue(":dep",  department.trimmed());
  query.bindValue(":role", role.trimmed());
  query.bindValue(":id",   id);
  return query.exec();
}

QJsonArray databasemanager::getAllPersonnel() {
  QJsonArray arr;
  QSqlQuery query("SELECT id, nfc_uid, name, department, role, created_at FROM personnel ORDER BY name ASC");
  while (query.next()) {
    QJsonObject obj;
    obj["id"] = query.value("id").toInt();
    obj["nfc_uid"] = query.value("nfc_uid").toString();
    obj["name"] = query.value("name").toString();
    obj["department"] = query.value("department").toString();
    obj["role"] = query.value("role").toString();
    arr.append(obj);
  }
  return arr;
}

QJsonObject databasemanager::lookupByNfcUid(const QString &nfcUid) {
  QJsonObject result;
  QSqlQuery query;
  query.prepare("SELECT id, name, department, role FROM personnel WHERE UPPER(nfc_uid) = UPPER(:nfc)");
  query.bindValue(":nfc", nfcUid.trimmed());

  if (query.exec() && query.next()) {
    result["found"] = true;
    result["id"] = query.value("id").toInt();
    result["name"] = query.value("name").toString();
    result["department"] = query.value("department").toString();
    result["role"] = query.value("role").toString();
  } else {
    result["found"] = false;
  }
  return result;
}

QString databasemanager::getPersonnelName(const QString &idOrNfc) {
  QSqlQuery query;
  query.prepare("SELECT name FROM personnel WHERE UPPER(nfc_uid) = UPPER(:val) OR id = :id_val");
  query.bindValue(":val", idOrNfc.trimmed());
  query.bindValue(":id_val", idOrNfc.toInt());
  if (query.exec() && query.next()) return query.value("name").toString();
  return "";
}

QJsonArray databasemanager::getAllInventoryItems() {
    // Arayuz cökmesin diye bos dönüyoruz.
    return QJsonArray();
}
