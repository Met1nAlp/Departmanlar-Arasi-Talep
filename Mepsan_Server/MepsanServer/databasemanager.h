#ifndef DATABASEMANAGER_H
#define DATABASEMANAGER_H

#include <QJsonArray>
#include <QJsonObject>
#include <QSqlDatabase>
#include <QString>

class databasemanager {
public:
  databasemanager();

  // Tablo yoksa oluştaracak fonksiyon
  bool connectToDatabase();
  // MAC database kontrolü
  bool isMacAuthorized(const QString &macAddress);
  // Sifre dogruysa database kaydedecek fonksiyon
  bool authorizeMac(const QString &macAddress, const QString &deviceId,
                    const QString &ipAddress, const QString &username);

  bool updateLastSeen(const QString &macAddress);

  bool updateLastAction(const QString &macAddress,
                        const QString &actionDetails);

  // Talepler (Requests) fonksiyonları
  bool createRequest(const QString &id, const QString &requesterId,
                     const QString &departmentId, const QString &productId,
                     int quantity, const QString &status,
                     const QString &createdAt,
                     const QString &priority = "NORMAL");
  QJsonArray getRequests(const QString &userId = "",
                         const QString &departmentId = "");
  bool updateRequestStatus(const QString &id, const QString &status,
                           const QString &timestampField,
                           const QString &timestampValue);

  // Faz 1: Yeni Fonksiyonlar
  bool cancelRequest(const QString &id, const QString &cancelReason,
                     const QString &cancelledAt);
  bool updatePriority(const QString &id, const QString &priority);
  bool fulfillRequest(const QString &id, int fulfilledQuantity,
                      const QString &newStatus, const QString &readyAt);
  bool escalateRequest(const QString &id);
  QJsonArray getEscalatedRequests();

private:
  QSqlDatabase db;
};

#endif // DATABASEMANAGER_H
