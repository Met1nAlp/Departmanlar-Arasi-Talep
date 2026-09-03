#ifndef TEST_H
#define TEST_H

#include <QObject>

class test : public QObject
{
    Q_OBJECT
public:
    explicit test(QObject *parent = nullptr);

    void gelen(QString a);
signals:
    void deneme(QString a);

};

#endif // TEST_H
