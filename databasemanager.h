#ifndef DATABASEMANAGER_H
#define DATABASEMANAGER_H

#include <QJsonArray>
#include <QJsonObject>
#include <QSqlDatabase>
#include <QString>

class databasemanager {
public:
  databasemanager();
  bool connectToDatabase();

  bool isDeviceAuthorized(const QString &serialNumber);
  bool addToWhitelist(const QString &serialNumber, const QString &deviceName);
  QJsonArray getAllDevices();
  bool removeDevice(const QString &serialNumber);
  bool updateLastSeen(const QString &serialNumber, const QString &ipAddress = "");
  bool updateLastUser(const QString &serialNumber, const QString &username);
  bool updateLastAction(const QString &serialNumber, const QString &actionDetails);

  bool createOrder(const QString &orderId, const QString &requesterId,
                   const QString &departmentId, const QJsonArray &items,
                   const QString &status, const QString &createdAt);
  QJsonArray getRequests(const QString &userId = "", const QString &departmentId = "");

  bool updateRequestStatus(const QString &id, const QString &status,
                           const QString &timestampField, const QString &timestampValue);
  bool cancelRequest(const QString &id, const QString &cancelReason,
                     const QString &cancelledAt, bool &wasPreparing);
  bool deleteRequest(const QString &reqId, bool &wasPreparing);

  bool addPendingCard(const QString &nfcUid, const QString &name = "");
  bool removePendingCard(const QString &nfcUid);
  QJsonArray getPendingCards();
  bool addPersonnel(const QString &nfcUid, const QString &name,
                    const QString &department, const QString &role = "uretim_yoneticisi");
  bool removePersonnel(int id);
  bool updatePersonnel(int id, const QString &nfcUid, const QString &name,
                       const QString &department, const QString &role);
  QJsonArray getAllPersonnel();
  QJsonObject lookupByNfcUid(const QString &nfcUid);
  QString getPersonnelName(const QString &idOrNfc);

  // Arayüz çökmesin diye boş liste döndürecek envanter fonksiyonu
  QJsonArray getAllInventoryItems();

private:
  QSqlDatabase db;
};

#endif // DATABASEMANAGER_H
