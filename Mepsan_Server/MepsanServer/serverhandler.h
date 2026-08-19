#ifndef SERVERHANDLER_H
#define SERVERHANDLER_H

#include "databasemanager.h"  // Authentication Sistemi
#include "inventorymanager.h" // Envanter Yönetimi
#include "qrprocessor.h"      // QR Kod
#include <QJsonArray>
#include <QJsonObject>
#include <QList>
#include <QObject>
#include <QWebSocket>
#include <QWebSocketServer>

// Sunucu yönetimi
class ServerHandler : public QObject {
  Q_OBJECT
public:
  // Port üzerinden server kuran
  explicit ServerHandler(quint16 port, const QString &passkey, QObject *parent = nullptr);
  // Bellek Temizleyici
  ~ServerHandler();

private slots:
  // Yeni baglantı
  void onNewConnection();
  // Varolan baglantı
  void processTextMessage(const QString &message);
  // Baglantı kopunca
  void socketDisconnected();

private:
  void
  broadcastMessage(const QJsonObject &messageObj); // YENI: broadcast fonksiyonu

  QWebSocketServer *webSocketServer; //
  QList<QWebSocket *> clients;       // baglanan listesi
  QString m_passkey;                 // Sunucu şifresi

  QrProcessor qrProcessor;
  InventoryManager inventoryManager;
  databasemanager dbManager;
};

#endif
