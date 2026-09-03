#include "webapihandler.h"
#include <QDateTime>

WebApiHandler::WebApiHandler(databasemanager *db, QObject *parent)
    : QObject(parent), dbManager(db) {}

QJsonObject WebApiHandler::processWebRequest(const QJsonObject &requestObj, const QStringList &activeEdgeSerials) {
    QString command = requestObj["command"].toString();
    QJsonObject response;

    if (command == "GET_ALL_DASHBOARD_DATA") {
        response["status"] = "ok";

        QJsonArray rawDevices = dbManager->getAllDevices();
        QJsonArray enrichedDevices;
        for (const QJsonValue &val : rawDevices) {
            QJsonObject d = val.toObject();
            d["is_online"] = activeEdgeSerials.contains(d["serial_number"].toString());
            enrichedDevices.append(d);
        }

        response["devices"] = enrichedDevices;
        response["requests"] = dbManager->getRequests();
        response["personnel"] = dbManager->getAllPersonnel();
        response["pending_cards"] = dbManager->getPendingCards();
    }
    else if (command == "APPROVE_CARD") {
        QJsonObject payload = requestObj["payload"].toObject();
        if (dbManager->addPersonnel(payload["nfc_uid"].toString(), payload["name"].toString(), payload["department"].toString(), payload["role"].toString())) {
            dbManager->removePendingCard(payload["nfc_uid"].toString());
            response["status"] = "ok";
            response["message"] = "Kart basariyla onaylandi.";
        }
    }
    else if (command == "DELETE_DEVICES") {
        QJsonArray sns = requestObj["payload"].toArray();
        for (const auto& val : sns) { dbManager->removeDevice(val.toString()); }
        response["status"] = "ok";
        response["message"] = "Seçili cihazlar silindi.";
    }
    else if (command == "DELETE_PERSONNEL") {
        QJsonArray ids = requestObj["payload"].toArray();
        for (const auto& val : ids) {
            dbManager->removePersonnel(val.toString().toInt());
            emit forceLogoutRequested(val.toString());
        }
        response["status"] = "ok";
        response["message"] = "Seçili personeller silindi. Cihazlara çıkış emri verildi.";
    }
    else if (command == "CANCEL_REQUESTS") {
        QJsonArray ids = requestObj["payload"].toArray();
        QString timeStr = QDateTime::currentDateTime().toString(Qt::ISODate);
        for (const auto& val : ids) {
            bool wasPreparing = false;
            dbManager->cancelRequest(val.toString(), "Web üzerinden iptal edildi.", timeStr, wasPreparing);
            if (wasPreparing) emit orderCancelledWarning(val.toString());
            emit orderDeletedByWeb(val.toString());
        }
        response["status"] = "ok";
        response["message"] = "Seçili siparişler iptal edildi.";
    }
    else if (command == "DELETE_REQUESTS") {
        QJsonArray ids = requestObj["payload"].toArray();
        for (const auto& val : ids) {
            bool wasPreparing = false;
            dbManager->deleteRequest(val.toString(), wasPreparing);
            if (wasPreparing) emit orderCancelledWarning(val.toString());
            emit orderDeletedByWeb(val.toString());
        }
        response["status"] = "ok";
        response["message"] = "Seçili siparişler kalıcı olarak silindi. Cihazlara bildirim gönderildi.";
    }
    else if (command == "APPROVE_REQUESTS") {
        QJsonArray ids = requestObj["payload"].toArray();
        for (const auto& val : ids) {
            dbManager->updateRequestStatus(val.toString(), "HAZIRLANIYOR", "", "");
        }
        response["status"] = "ok";
        response["message"] = "Siparişler onaylandı ve Hazırlanıyor aşamasına geçti.";
    }
    else {
        response["status"] = "error";
        response["message"] = "Bilinmeyen Web API Komutu!";
    }

    response["command"] = command + "_RESPONSE";
    return response;
}
