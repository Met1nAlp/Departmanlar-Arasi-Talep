#ifndef EVENTLOGGER_H
#define EVENTLOGGER_H

#include <QString>
#include <QJsonArray>
#include <QJsonObject>
#include <QSqlQuery>
#include <QSqlError>
#include <QDateTime>
#include <QDebug>

class EventLogger {
public:
    EventLogger();

    bool initTable();

    bool logRequestEvent(const QString &requestId, const QString &oldStatus, const QString &newStatus);

    QJsonArray getEventsSince(const QString &sinceTimestamp);
};

#endif // EVENTLOGGER_H
