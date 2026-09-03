#include "inventorymanager.h"
#include <QDebug>

InventoryManager::InventoryManager() {

  // Mock eşyaları
  mockDatabase.insert(
      "MEPSAN_PRINTER_001",
      {"MEPSAN_PRINTER_001", "HP Laser Printer", "STOKTA VAR", ""});
  mockDatabase.insert(
      "MEPSAN_LAPTOP_002",
      {"MEPSAN_LAPTOP_002", "Lenovo Thinkpad", "KULLANIMDA", "Baris"});
  mockDatabase.insert(
      "MEPSAN_DRILL_003",
      {"MEPSAN_DRILL_003", "Bosch Darbeli Matkap", "STOKTA YOK", ""});
}

// Envanterden Esya alma kontrolü
bool InventoryManager::checkoutItem(const QString &qrCode,
                                    const QString &username) {
  if (mockDatabase.contains(qrCode)) {
    InventoryItem &item = mockDatabase[qrCode];

    if (item.status == "KULLANIMDA") {
      qDebug() << "[ERROR] Esya zaten su kisi tarafindan kullanimda:"
               << item.assignedTo;
      return false;
    }

    item.status = "KULLANIMDA";
    item.assignedTo = username;
    qDebug() << "[ENVANTER] Checkout Basarili -> Esya:" << item.name
             << "| Tarafindan:" << username;
    return true;
  }
  return false;
}

// Envantere geri eşya ekleme
bool InventoryManager::checkinItem(const QString &qrCode) {
  if (mockDatabase.contains(qrCode)) {
    InventoryItem &item = mockDatabase[qrCode];

    item.status = "STOKTA_VAR";
    item.assignedTo = "";
    qDebug() << "[ENVANTER] Checkin Basarili -> Esya:" << item.name
             << "Tekrardan stokta";
    return true;
  }
  return false;
}

QJsonObject InventoryManager::getItemDetails(const QString &qrCode) {
  QJsonObject response;

  // QR Doğruysa eşya bilgileri
  if (mockDatabase.contains(qrCode)) {
    InventoryItem item = mockDatabase.value(qrCode);

    response["found"] = true;
    response["name"] = item.name;
    response["status"] = item.status;
    response["assigned_to"] = item.assignedTo;

    qDebug() << "[VERITABANI] Esya Bulundu:" << item.name;
  }

  // QR bulamazsa
  else {
    response["found"] = false;
    qDebug() << "[VERITABANI] HATA: Bu QR koda ait esya bulunamadi.";
  }

  return response;
}

#include <QJsonArray>

QJsonArray InventoryManager::getAllItems() {
  QJsonArray arr;
  for (const InventoryItem &item : mockDatabase) {
    QJsonObject obj;
    obj["qrCode"] = item.qrCode;
    obj["name"] = item.name;
    obj["status"] = item.status;
    obj["assignedTo"] = item.assignedTo;
    arr.append(obj);
  }
  return arr;
}
