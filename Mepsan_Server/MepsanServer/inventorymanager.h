#ifndef INVENTORYMANAGER_H
#define INVENTORYMANAGER_H

#include <QObject>
#include <QMap>
#include <QJsonObject>

// Esyanın Özellikleri
struct InventoryItem {
    QString qrCode;
    QString name;
    QString status;
    QString assignedTo;
};

class InventoryManager
{
public:
    InventoryManager();

    QJsonObject getItemDetails(const QString &qrCode);
    bool checkoutItem(const QString &qrCode, const QString &username);
    bool checkinItem(const QString &qrCode);

private:
    // Mock Database
    QMap<QString, InventoryItem> mockDatabase;

};

#endif // INVENTORYMANAGER_H
