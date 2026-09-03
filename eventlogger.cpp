#include "eventlogger.h"

EventLogger::EventLogger() {
    initTable();
}

bool EventLogger::initTable() {
    QSqlQuery query;
    bool success = query.exec(
        "CREATE TABLE IF NOT EXISTS request_events ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "request_id TEXT NOT NULL, "
        "old_status TEXT, "
        "new_status TEXT NOT NULL, "
        "occurred_at TEXT NOT NULL)"
    );

    if (!success) {
        qDebug() << "[EVENT_LOGGER HATA] Tablo olusturulamadi:" << query.lastError().text();
    }
    return success;
}

bool EventLogger::logRequestEvent(const QString &requestId, const QString &oldStatus, const QString &newStatus) {
    QSqlQuery query;
    query.prepare(
        "INSERT INTO request_events (request_id, old_status, new_status, occurred_at) "
        "VALUES (:reqId, :oldStatus, :newStatus, :occurredAt)"
    );

    QString nowUtc = QDateTime::currentDateTimeUtc().toString(Qt::ISODateWithMs);

    query.bindValue(":reqId", requestId.trimmed());
    query.bindValue(":oldStatus", oldStatus.trimmed());
    query.bindValue(":newStatus", newStatus.trimmed());
    query.bindValue(":occurredAt", nowUtc);

    if (query.exec()) {
        qDebug() << "[EVENT_LOGGER] Olay kaydedildi -> ID:" << requestId
                 << "|" << oldStatus << "->" << newStatus;
        return true;
    }

    qDebug() << "[EVENT_LOGGER HATA] Olay kaydedilemedi:" << query.lastError().text();
    return false;
}

QJsonArray EventLogger::getEventsSince(const QString &sinceTimestamp) {
    QJsonArray eventsArray;
    QSqlQuery query;

    query.prepare(
        "SELECT request_id, old_status, new_status, occurred_at "
        "FROM request_events "
        "WHERE occurred_at > :since "
        "ORDER BY occurred_at ASC"
    );
    query.bindValue(":since", sinceTimestamp.trimmed());

    if (query.exec()) {
        while (query.next()) {
            QJsonObject eventObj;
            eventObj["request_id"] = query.value("request_id").toString();
            eventObj["old_status"] = query.value("old_status").toString();
            eventObj["new_status"] = query.value("new_status").toString();
            eventObj["occurred_at"] = query.value("occurred_at").toString();
            eventsArray.append(eventObj);
        }
    } else {
        qDebug() << "[EVENT_LOGGER HATA] Olaylar cekilemedi:" << query.lastError().text();
    }

    return eventsArray;
}
