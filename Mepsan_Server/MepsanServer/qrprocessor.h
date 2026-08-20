#ifndef QRPROCESSOR_H
#define QRPROCESSOR_H

#include <QObject>
#include <QString>

class QrProcessor : public QObject {
    Q_OBJECT
public:
    explicit QrProcessor(QObject *parent = nullptr);

    // QR kod verisini işleyecek fonksiyon
    bool validateQrCode(const QString &qrData);
};

#endif
