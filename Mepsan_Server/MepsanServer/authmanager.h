#ifndef AUTHMANAGER_H
#define AUTHMANAGER_H

#include <QObject>

class AuthManager : public QObject
{
    Q_OBJECT
public:
    explicit AuthManager(QObject *parent = nullptr);

signals:

};

#endif // AUTHMANAGER_H
