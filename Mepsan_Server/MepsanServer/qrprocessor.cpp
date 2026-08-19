#include "qrprocessor.h"
#include <QDebug>

QrProcessor::QrProcessor(QObject *parent) : QObject(parent) {

}
bool QrProcessor::validateQrCode(const QString &qrData) {
    qDebug() << "[QR_SISTEMI] QR Analiz Ediliyor:" << qrData;

    // Mock Dogrulama
    // MEPSAN_ ile başlıyorsa geçerli
    if (qrData.startsWith("MEPSAN_")) {
        qDebug() << "[QR_SISTEMI] QR Kodu Bulundu.";
        return true;
    } else {
        qDebug() << "[QR_SISTEMI] HATA: Gecersiz QR Kodu";
        return false;
    }
}



