#include "serverhandler.h"
#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QEventLoop>
#include <QUrl>

ServerHandler::ServerHandler(quint16 port, QObject *parent)
    : QObject(parent),
      webSocketServer(new QWebSocketServer(QStringLiteral("Mepsan Server"), QWebSocketServer::NonSecureMode, this)) {

  dbManager.connectToDatabase();
  webApi = new WebApiHandler(&dbManager, this);

  connect(webApi, &WebApiHandler::forceLogoutRequested, this, [this](const QString &uid){
      QJsonObject push; push["command"] = "FORCE_LOGOUT"; push["nfc_uid"] = uid;
      broadcastToSaha(push);
      emitLog("[PUSH] FORCE_LOGOUT sinyali sahaya fırlatıldı.");
  });

  connect(webApi, &WebApiHandler::orderDeletedByWeb, this, [this](const QString &orderId){
      QJsonObject payloadObj;
      payloadObj["id"] = orderId;

      QJsonObject eventMsg;
      eventMsg["type"] = "event";
      eventMsg["event_name"] = "REQUEST_DELETED";
      eventMsg["payload"] = payloadObj;

      broadcastToSaha(eventMsg);
      emitLog(QString("[PUSH] REQUEST_DELETED sinyali sahaya fırlatıldı -> ID: %1").arg(orderId));
  });

  if (webSocketServer->listen(QHostAddress::Any, port)) {
    emitLog(QString("[SERVER] Mepsan Server aktif. Port: %1").arg(port));
    connect(webSocketServer, &QWebSocketServer::newConnection, this, &ServerHandler::onNewConnection);
  }
}

ServerHandler::~ServerHandler() {
  webSocketServer->close();
  qDeleteAll(clients.begin(), clients.end());
}

void ServerHandler::emitLog(const QString &msg) {
  qDebug() << msg; emit logReceived(msg);
}

void ServerHandler::broadcastToWeb(const QJsonObject &messageObj) {
  QJsonDocument doc(messageObj);
  QString msgString = doc.toJson(QJsonDocument::Compact);
  for (QWebSocket *client : qAsConst(clients)) {
    if (client->isValid()) client->sendTextMessage(msgString);
  }
}

void ServerHandler::broadcastToSaha(const QJsonObject &messageObj) {
  QJsonDocument doc(messageObj);
  QString msgString = doc.toJson(QJsonDocument::Compact);
  for (QWebSocket *sahaSocket : activeSahaDevices.values()) {
    if (sahaSocket->isValid()) sahaSocket->sendTextMessage(msgString);
  }
}

void ServerHandler::onNewConnection() {
  QWebSocket *clientSocket = webSocketServer->nextPendingConnection();
  connect(clientSocket, &QWebSocket::textMessageReceived, this, &ServerHandler::processTextMessage);
  connect(clientSocket, &QWebSocket::disconnected, this, &ServerHandler::socketDisconnected);
  clients << clientSocket;
  emitLog("[BAGLANTI] Yeni cihaz bağlandı.");
}

void ServerHandler::processTextMessage(const QString &message) {
  QWebSocket *clientSocket = qobject_cast<QWebSocket *>(sender());
  if (!clientSocket) return;

  QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());
  if (doc.isNull() || !doc.isObject()) return;
  QJsonObject jsonObj = doc.object();
  QString command = jsonObj["command"].toString();
  QString serialNumber = jsonObj["serial_number"].toString().trimmed().toUpper();

  // 1. ÇOKLU ROL (RBAC) YÖNETİCİ GİRİŞ SİSTEMİ
  if (command == "WEB_LOGIN") {
      QString user = jsonObj["username"].toString();
      QString pass = jsonObj["password"].toString();
      QJsonObject response;
      response["command"] = "WEB_LOGIN_RESPONSE";

      if (user == "superadmin" && pass == "mepsan2026") {
          response["status"] = "ok"; response["message"] = "Süper Admin Girişi Başarılı.";
          response["role"] = "super_admin"; response["dept"] = "ALL"; response["userId"] = "Süper Admin";
      } else if (user == "admin" && pass == "mepsan2026") {
          response["status"] = "ok"; response["message"] = "Admin Girişi Başarılı.";
          response["role"] = "admin"; response["dept"] = "ALL"; response["userId"] = "Admin";
      } else if (user == "elektronik" && pass == "123456") {
          response["status"] = "ok"; response["message"] = "Departman Girişi Başarılı.";
          response["role"] = "departman_yetkilisi"; response["dept"] = "elektronik_uretim"; response["userId"] = "Elektronik Sorumlusu";
      } else {
          response["status"] = "error";
          response["message"] = "Hatalı kullanıcı adı veya şifre!";
      }
      clientSocket->sendTextMessage(QJsonDocument(response).toJson(QJsonDocument::Compact));
      return;
  }

  // 2. KİŞİYE ÖZEL WEB VE SAHA (PERSONEL) GİRİŞİ (NFC VEYA SİCİL NO İLE)
  if (command == "CARD_LOGIN") {
    QString nfcUid = jsonObj["nfc_uid"].toString().trimmed();
    QJsonObject personnel = dbManager.lookupByNfcUid(nfcUid);

    if (personnel["found"].toBool()) {
      QString personName = personnel["name"].toString();

      // Sadece sahadan geldiyse cihaz geçmişini güncelle
      if (serialNumber != "WEB_PORTAL") {
          dbManager.updateLastAction(serialNumber, "KART GIRIS: " + personName);
          emit deviceTableChanged();
      }

      QJsonObject response;
      response["command"] = "CARD_LOGIN_RESPONSE"; // Frontend'in anlaması için komut eklendi
      response["status"] = "ok";
      response["user"] = personnel;
      clientSocket->sendTextMessage(QJsonDocument(response).toJson(QJsonDocument::Compact));
      return;
    }

    emitLog(QString("[API] Sicil/Kart yerelde bulunamadı, Mepsan API'ye soruluyor: %1").arg(nfcUid));

    QNetworkRequest request(QUrl("https://api.mepsan.com.tr/CardInfo/GetUser"));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    QJsonObject reqObj; reqObj["pdksCode"] = nfcUid;
    QNetworkAccessManager *manager = new QNetworkAccessManager(this);
    QNetworkReply *reply = manager->post(request, QJsonDocument(reqObj).toJson());

    connect(reply, &QNetworkReply::finished, this, [this, clientSocket, reply, manager, nfcUid]() {
        QString apiName = ""; bool foundInApi = false;
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument replyDoc = QJsonDocument::fromJson(reply->readAll());
            if (replyDoc.object()["response"].toObject()["responseCode"].toString() == "1") {
                apiName = replyDoc.object()["user"].toObject()["nameSurname"].toString();
                foundInApi = true;
            }
        }
        dbManager.addPendingCard(nfcUid, apiName);
        emit requestTableChanged();

        QJsonObject errResponse;
        errResponse["command"] = "CARD_LOGIN_RESPONSE";
        errResponse["status"] = "error";
        errResponse["error_code"] = foundInApi ? "WAITING_APPROVAL" : "CARD_NOT_FOUND";

        if (clients.contains(clientSocket) && clientSocket->isValid()) {
            clientSocket->sendTextMessage(QJsonDocument(errResponse).toJson(QJsonDocument::Compact));
        }
        reply->deleteLater(); manager->deleteLater();
    });
    return;
  }

  // 3. SİPARİŞ OLUŞTURMA (LOG EKLENDİ)
  if (command == "CREATE_REQUEST") {
    QString orderId = jsonObj["order_id"].toString();
    QString reqId = jsonObj["requester_id"].toString();
    QJsonArray items = jsonObj["items"].toArray();

    // WEB'DEN Mİ GELDİ CİHAZDAN MI, EKRANA LOG YAZDIRALIM!
    QString kaynak = (serialNumber == "WEB_PORTAL") ? "WEB SİTESİ" : "SAHA TABLETİ";
    emitLog(QString("[SİPARİŞ] %1 üzerinden yeni sipariş! Talep Eden: %2, Sipariş ID: %3").arg(kaynak, reqId, orderId));

    if (dbManager.createOrder(orderId, reqId, jsonObj["department_id"].toString(), items, "TALEP_ALINDI", jsonObj["created_at"].toString())) {
      QString reqName = dbManager.getPersonnelName(reqId);

      if (serialNumber != "WEB_PORTAL") {
          dbManager.updateLastAction(serialNumber, "YENI SIPARIS: " + (reqName.isEmpty() ? reqId : reqName));
          emit deviceTableChanged();
      }

      emit requestTableChanged();

      QJsonObject response; response["command"] = "CREATE_REQUEST_RESPONSE";
      response["status"] = "ok"; response["requester_name"] = reqName.isEmpty() ? reqId : reqName;
      clientSocket->sendTextMessage(QJsonDocument(response).toJson(QJsonDocument::Compact));
    } else {
      clientSocket->sendTextMessage("{\"command\":\"CREATE_REQUEST_RESPONSE\", \"status\":\"error\", \"message\":\"Siparis olusturulamadi.\"}");
    }
    return;
  }

  // 4. DIŞ ENVANTER (MEPSAN API)
  if (command == "SEARCH_INVENTORY_API") {
      QString queryStr = jsonObj["query"].toString();
      emitLog("[API] Dış Sistemde Aranıyor: " + queryStr);

      QNetworkRequest request(QUrl("https://api.mepsan.com.tr/CardInfo/GetProduct"));
      request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

      QJsonObject reqObj; reqObj["prodCode"] = queryStr;

      QNetworkAccessManager *manager = new QNetworkAccessManager(this);
      QNetworkReply *reply = manager->post(request, QJsonDocument(reqObj).toJson());

      connect(reply, &QNetworkReply::finished, this, [this, clientSocket, reply, manager]() {
          QJsonObject res; res["command"] = "API_SEARCH_RESPONSE";
          if (reply->error() == QNetworkReply::NoError) {
              QJsonDocument replyDoc = QJsonDocument::fromJson(reply->readAll());
              QJsonObject replyObj = replyDoc.object();
              if (replyObj["response"].toObject()["responseCode"].toString() == "1") {
                  QString urunAdi = replyObj["product"].toObject()["urunTypeName"].toString().trimmed();
                  if (urunAdi.isEmpty() || urunAdi.toLower() == "null") {
                      res["status"] = "error"; res["item_name"] = "TANIMSIZ ÜRÜN KODU";
                  } else {
                      res["status"] = "ok"; res["item_name"] = urunAdi;
                  }
              } else {
                  res["status"] = "error"; res["item_name"] = "API'DE BULUNAMADI!";
              }
          } else {
              res["status"] = "error"; res["item_name"] = "BAĞLANTI HATASI!";
          }
          if (clients.contains(clientSocket) && clientSocket->isValid()) {
              clientSocket->sendTextMessage(QJsonDocument(res).toJson(QJsonDocument::Compact));
          }
          reply->deleteLater(); manager->deleteLater();
      });
      return;
  }

  if (command == "ADD_DEVICE") {
      QJsonObject payload = jsonObj["payload"].toObject();
      dbManager.addToWhitelist(payload["serial_number"].toString(), payload["device_name"].toString());
      QJsonObject response; response["command"] = "ADD_DEVICE_RESPONSE"; response["status"] = "ok";
      clientSocket->sendTextMessage(QJsonDocument(response).toJson(QJsonDocument::Compact));
      emit deviceTableChanged(); return;
  }

  if (command == "GET_ALL_DASHBOARD_DATA" || command == "APPROVE_CARD" || command == "DELETE_PERSONNEL" ||
      command == "CANCEL_REQUESTS" || command == "DELETE_REQUESTS" || command == "DELETE_DEVICES") {

        QString userRole = jsonObj["user_role"].toString();
        QString userDept = jsonObj["user_dept"].toString();

        QJsonObject apiResponse = webApi->processWebRequest(jsonObj, activeSahaDevices.keys());

        if (command == "GET_ALL_DASHBOARD_DATA" && userRole == "departman_yetkilisi") {
            QJsonArray allReqs = apiResponse["requests"].toArray();
            QJsonArray filteredReqs;
            for (const QJsonValue &val : allReqs) {
                if (val.toObject()["departmentId"].toString() == userDept) {
                    filteredReqs.append(val);
                }
            }
            apiResponse["requests"] = filteredReqs;
        }

        QJsonDocument responseDoc(apiResponse);
        clientSocket->sendTextMessage(responseDoc.toJson(QJsonDocument::Compact));

        if (command == "DELETE_PERSONNEL" && apiResponse["status"].toString() == "ok") {
            QJsonArray deletedIds = jsonObj["payload"].toArray();
            for (const QJsonValue &val : deletedIds) {
                QJsonObject eventMsg;
                eventMsg["type"] = "event"; eventMsg["event_name"] = "USER_DELETED";
                QJsonObject payloadObj; payloadObj["id"] = val.toVariant().toInt();
                eventMsg["payload"] = payloadObj;
                broadcastToSaha(eventMsg);
            }
        }
        return;
  }

  if (command == "DEVICE_LOGIN_ATTEMPT") {
      emitLog("[SİSTEM] Yeni cihaz onay bekliyor: " + serialNumber);
      clientSocket->sendTextMessage("{\"status\":\"error\", \"error_code\":\"DEVICE_NOT_APPROVED\"}");
      return;
  }

  if (command == "CANCEL_REQUEST") {
    QString reqId = jsonObj["order_id"].toString();
    bool wasPreparing = false;
    QString timeStr = QDateTime::currentDateTime().toString(Qt::ISODate);

    if (dbManager.cancelRequest(reqId, "Web uzerinden iptal edildi.", timeStr, wasPreparing)) {
      emit requestTableChanged();
      clientSocket->sendTextMessage("{\"status\":\"ok\", \"message\":\"Siparis iptal edildi.\"}");
    }
    return;
  }
}

void ServerHandler::socketDisconnected() {
  QWebSocket *clientSocket = qobject_cast<QWebSocket *>(sender());
  if (clientSocket) {
    clients.removeAll(clientSocket);
    clientSocket->deleteLater();
  }
}
