#include <QCoreApplication>
#include <QSettings>
#include <QDebug>
#include "serverhandler.h"

int main(int argc, char *argv[])
{
    QCoreApplication app(argc, argv);

    QString configPath = QCoreApplication::applicationDirPath() + "/server_config.ini";
    QSettings settings(configPath, QSettings::IniFormat);

    if (!settings.contains("Network/Port")) {
        //Port settingsten değişiyor
        settings.setValue("Network/Port", 1234);
        qDebug() <<"[AYAR] 'server_config.ini' dosyasi varsayilan 1234 portuyla olusturuldu.";
    }

    if (!settings.contains("Security/Passkey")) {
        settings.setValue("Security/Passkey", "MPSN1992");
        qDebug() <<"[AYAR] 'server_config.ini' dosyasina varsayilan sifre eklendi.";
    }

    quint16 serverPort = settings.value("Network/Port").toUInt();
    QString serverPasskey = settings.value("Security/Passkey").toString();

    qDebug() << "[AYAR] Ayar dosyasi basariyla okundu." << configPath;
    qDebug() << "[AYAR] Sunucu su port uzerinden baslatiliyor:" << serverPort;
    qDebug() << "[AYAR] Sunucu sifresi ayarlandi.";

    ServerHandler server(serverPort, serverPasskey);

    return app.exec();
}
