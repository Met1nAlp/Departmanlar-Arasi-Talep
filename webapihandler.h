#ifndef WEBAPIHANDLER_H
#define WEBAPIHANDLER_H

#include <QObject>
#include <QJsonObject>
#include <QJsonArray>
#include <QStringList>
#include "databasemanager.h"

class WebApiHandler : public QObject {
    Q_OBJECT
public:
    explicit WebApiHandler(databasemanager *db, QObject *parent = nullptr);
    QJsonObject processWebRequest(const QJsonObject &requestObj, const QStringList &activeEdgeSerials);

signals:
    void forceLogoutRequested(const QString &nfcUid);
    void orderDeletedByWeb(const QString &orderId);
    void orderCancelledWarning(const QString &orderId);

private:
    databasemanager *dbManager;
};

#endif // WEBAPIHANDLER_H
