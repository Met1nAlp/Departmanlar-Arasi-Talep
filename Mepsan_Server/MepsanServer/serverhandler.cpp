#include "serverhandler.h"
#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>

ServerHandler::ServerHandler(quint16 port, const QString &passkey, QObject *parent)
    : QObject(parent),
      webSocketServer(new QWebSocketServer(QStringLiteral("Mepsan Server"),
                                           QWebSocketServer::NonSecureMode,
                                           this)),
      m_passkey(passkey) {

  dbManager.connectToDatabase();

  // Belirtilen port üzerinden tum IP adreslerine dinlemeye aliyoruz
  if (webSocketServer->listen(QHostAddress::Any, port)) {
    qDebug() << "[SERVER] WebSocket Serveri su port uzerinden calisiyor:"
             << port;
    // Yeni bir cihaz bağlanınca onNewConnection fonksiyonu başlatıyoruz
    connect(webSocketServer, &QWebSocketServer::newConnection, this,
            &ServerHandler::onNewConnection);
  } else {
    qDebug() << "[HATA] Server Baslatilamadi";
  }
}

// Bellek Temizleme
ServerHandler::~ServerHandler() {
  webSocketServer->close();
  qDeleteAll(clients.begin(), clients.end());
}

// Tüm bağlı istemcilere mesaj yollama (Broadcast)
void ServerHandler::broadcastMessage(const QJsonObject &messageObj) {
  QJsonDocument doc(messageObj);
  QString msgString = doc.toJson(QJsonDocument::Compact);
  for (QWebSocket *client : qAsConst(clients)) {
    if (client->isValid()) {
      client->sendTextMessage(msgString);
    }
  }
}

// Yeni Baglantı
void ServerHandler::onNewConnection() {
  // Sırada bekleyen baglantıyı soket olarak alıyoruz
  QWebSocket *clientSocket = webSocketServer->nextPendingConnection();

  // Veri Gelince
  connect(clientSocket, &QWebSocket::textMessageReceived, this,
          &ServerHandler::processTextMessage);
  // Baglantı Kopunca
  connect(clientSocket, &QWebSocket::disconnected, this,
          &ServerHandler::socketDisconnected);

  clients << clientSocket;
  qDebug() << "[BAGLANTI] Yeni Musteri Baglandı.";
}

void ServerHandler::processTextMessage(const QString &message) {
  QWebSocket *clientSocket = qobject_cast<QWebSocket *>(sender());
  if (!clientSocket)
    return;

  qDebug() << "[VERI ALINDI]:" << message;

  // JSON dan UTF 8 çevirme
  QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());

  if (doc.isNull() || !doc.isObject()) {
    qDebug() << "[HATA] Veri JSON formatinda degil.Istek iptal edildi.";
    clientSocket->sendTextMessage(
        "{\"status\":\"error\", \"message\":\"Yanlis format.JSON formatinda "
        "tekrar deneyiniz.\"}");
    return;
  }

  // JSON->C++
  QJsonObject jsonObj = doc.object();
  QString command = jsonObj["command"].toString();
  QString macAddress = jsonObj["mac_address"].toString().trimmed();

  if (macAddress.isEmpty()) {
    clientSocket->sendTextMessage(
        "{\"status\":\"error\", \"message\":\"MAC Adresi bulunamadi.\"}");
    return;
  }

  // Mac adresi onaylatma komutu
  bool isAuthorized = dbManager.isMacAuthorized(macAddress);

  if (!isAuthorized && command != "AUTH_REQUEST") {
    clientSocket->sendTextMessage(
        "{\"status\":\"error\", \"message\":\"ONAYLANMAMIS CIHAZ! Lutfen ilk "
        "cihazinizi onaylatiniz.\"}");
    return;
  }

  // Son görülme
  if (isAuthorized) {
    dbManager.updateLastSeen(macAddress);
  }
  if (command == "AUTH_REQUEST") {
    QString deviceId = jsonObj["device_id"].toString();
    QString passkey = jsonObj["passkey"].toString();
    QString username = jsonObj["username"].toString();

    QString ipAddress = clientSocket->peerAddress().toString();
    if (ipAddress.startsWith("::ffff:")) {
      ipAddress = ipAddress.mid(7);
    }
    if (passkey == m_passkey) {
      if (dbManager.authorizeMac(macAddress, deviceId, ipAddress, username)) {
        clientSocket->sendTextMessage(
            "{\"status\":\"ok\", \"message\":\"Dogrulama Basarili. Cihaz "
            "sisteme kaydedildi.\"}");
      } else {
        clientSocket->sendTextMessage(
            "{\"status\":\"error\", \"message\":\"Veritabani Hatasi! Cihaz "
            "kaydedilemedi.\"}");
      }
    } else {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Dogrulama Basarisiz. Sifre "
          "hatali.\"}");
    }
    return;
  }

  // Esya alma
  else if (command == "CHECKOUT_ITEM") {
    QString qrData = jsonObj["qr_data"].toString();
    QString username = jsonObj["username"].toString();

    if (qrData.isEmpty() || username.isEmpty()) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Checkout icin yetersiz "
          "bilgi.\"}");
      return;
    }

    if (inventoryManager.checkoutItem(qrData, username)) {
      dbManager.updateLastAction(macAddress, "CHECKOUT: " + qrData);
      clientSocket->sendTextMessage(
          "{\"status\":\"ok\", \"message\":\"Checkout basariyla yapildi.\"}");
    } else {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Checkout basarisiz. Esya "
          "kullanımda.\"}");
    }
    return;
  }

  // Esya geri verme
  else if (command == "CHECKIN_ITEM") {
    QString qrData = jsonObj["qr_data"].toString();

    if (qrData.isEmpty()) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"QR Bos Olamaz\"}");
      return;
    }

    if (inventoryManager.checkinItem(qrData)) {
      dbManager.updateLastAction(macAddress, "CHECKIN: " + qrData);
      clientSocket->sendTextMessage("{\"status\":\"ok\", \"message\":\"Esya "
                                    "envantere basariyla geri donduruldu.\"}");
    } else {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Checkin basarisiz. Esya "
          "bulunamadi.\"}");
    }
    return;

  }

  // Test
  else if (command == "TEST") {
    qDebug() << "[ISLEM] Test komutu alindi. Sistem baglantisi kuruldu.";
    clientSocket->sendTextMessage(
        "{\"status\":\"ok\", \"message\":\"Test basariyla tamamlandi.\"}");
  } // Sistem başlangıç
  else if (command == "START_SYSTEM") {
    qDebug()
        << "[ISLEM]] Sistem Baslangic Komutu Algilandi. Fonksiyon Baslatiliyor";
    // Sistem başlatma buraya gelcek
    clientSocket->sendTextMessage(
        "{\"status\":\"ok\", \"message\":\"Sistem Basladi.\"}");
  }
  // Qr kodu tanıma
  else if (command == "PROCESS_QR") {
    QString qrData = jsonObj["qr_data"].toString();

    if (qrData.isEmpty()) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"QR Kodu Bos Olamaz.\"}");
      return;
    }

    // QrProcessor üzerinden doğrulama
    bool isValid = qrProcessor.validateQrCode(qrData);

    if (!isValid) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Gecersiz QR Kodu.\"}");
      return;
    }

    dbManager.updateLastAction(macAddress, "QR_QUERY: " + qrData);

    // Esya detayları
    QJsonObject itemDetails = inventoryManager.getItemDetails(qrData);

    // Json geri dönüt
    QJsonObject response;
    if (itemDetails["found"].toBool()) {
      response["status"] = "ok";
      response["message"] = "Esya envanterde var.";
      response["item_info"] = itemDetails;
    } else {
      response["status"] = "hata";
      response["message"] = "QR Kodu bulundu fakat esya envanterde yok";
    }
    QJsonDocument responseDoc(response);
    clientSocket->sendTextMessage(responseDoc.toJson(QJsonDocument::Compact));
    return;
  }
  // YENI: Talep olusturma
  else if (command == "CREATE_REQUEST") {
    QString id = jsonObj["id"].toString();
    QString reqId = jsonObj["requester_id"].toString();
    QString depId = jsonObj["department_id"].toString();
    QString prodId = jsonObj["product_id"].toString();
    int qty = jsonObj["quantity"].toInt();
    QString status = jsonObj["status"].toString();
    QString createdAt = jsonObj["created_at"].toString();

    if (id.isEmpty() || reqId.isEmpty()) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Eksik talep bilgileri.\"}");
      return;
    }

    if (dbManager.createRequest(id, reqId, depId, prodId, qty, status,
                                createdAt)) {
      // İsteği oluşturan kişiye cevap dön
      clientSocket->sendTextMessage(
          "{\"status\":\"ok\", \"message\":\"Talep basariyla olusturuldu.\"}");

      // Tüm bağlı istemcilere bu yeni talebi "Olay" (Event) olarak bildir
      QJsonObject eventMsg;
      eventMsg["type"] = "event";
      eventMsg["event_name"] = "REQUEST_CREATED";
      eventMsg["payload"] = jsonObj;
      broadcastMessage(eventMsg);
    } else {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Talep olusturulamadi.\"}");
    }
    return;
  }
  // Talepleri Getir
  else if (command == "GET_REQUESTS") {
    QString userId = jsonObj["user_id"].toString();
    QString depId = jsonObj["department_id"].toString();

    QJsonArray requests = dbManager.getRequests(userId, depId);

    QJsonObject response;
    response["status"] = "ok";
    response["command"] = "GET_REQUESTS_RESPONSE";
    response["data"] = requests;

    QJsonDocument responseDoc(response);
    clientSocket->sendTextMessage(responseDoc.toJson(QJsonDocument::Compact));
    return;
  }
  // Talep Durumunu Guncelle
  else if (command == "UPDATE_REQUEST_STATUS") {
    QString id = jsonObj["id"].toString();
    QString status = jsonObj["status"].toString();
    QString timestampField =
        jsonObj["timestamp_field"].toString(); // ornegin: "ready_at"
    QString timestampValue =
        jsonObj["timestamp_value"].toString(); // ornegin: "2026-08-18T..."

    if (id.isEmpty() || status.isEmpty()) {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Eksik guncelleme "
          "bilgileri.\"}");
      return;
    }

    if (dbManager.updateRequestStatus(id, status, timestampField,
                                      timestampValue)) {
      clientSocket->sendTextMessage(
          "{\"status\":\"ok\", \"message\":\"Talep durumu guncellendi.\"}");

      // Tüm cihazlara durum degisikligini bildir (Gercek Zamanli Guncelleme)
      QJsonObject eventMsg;
      eventMsg["type"] = "event";
      eventMsg["event_name"] = "REQUEST_STATUS_UPDATED";
      eventMsg["payload"] = jsonObj;
      broadcastMessage(eventMsg);
    } else {
      clientSocket->sendTextMessage(
          "{\"status\":\"error\", \"message\":\"Talep guncellenemedi.\"}");
    }
    return;
  } else {
    qDebug() << "[UYARI] Bilinmeyen Komut Algilandi:" << command;
    clientSocket->sendTextMessage(
        "{\"status\":\"error\", \"message\":\"Bilinmeyen Komut.\"}");
  }
}

// Cıkanların Bilgisini Temizleme
void ServerHandler::socketDisconnected() {
  QWebSocket *clientSocket = qobject_cast<QWebSocket *>(sender());
  if (clientSocket) {
    qDebug() << "[BAGLANTI KOPTU] Musteri Cikti..";
    clients.removeAll(clientSocket); // Listeden cıkarır
    clientSocket->deleteLater();     // Bellekten silinmesini sağlama
  }
}
