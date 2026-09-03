#ifndef SERVERHANDLER_H
#define SERVERHANDLER_H

#include "webapihandler.h"
#include "databasemanager.h"
#include <QJsonArray>
#include <QJsonObject>
#include <QMap>
#include <QObject>
#include <QWebSocket>
#include <QWebSocketServer>

class ServerHandler : public QObject {
  Q_OBJECT
public:
  explicit ServerHandler(quint16 port, QObject *parent = nullptr);
  ~ServerHandler();

signals:
  void logReceived(const QString &message);
  void deviceTableChanged();
  void requestTableChanged();

private slots:
  void onNewConnection();
  void processTextMessage(const QString &message);
  void socketDisconnected();

private:
  void broadcastToWeb(const QJsonObject &messageObj);
  void broadcastToSaha(const QJsonObject &messageObj);
  void emitLog(const QString &msg);

  QWebSocketServer *webSocketServer;

  QList<QWebSocket *> clients;
  QMap<QString, QWebSocket*> activeSahaDevices;

  WebApiHandler *webApi;
  databasemanager dbManager;
};

#endif
