#include "test.h"
#include <QDebug>
test::test(QObject *parent)
    : QObject{parent}
{
     QObject::connect(this, &test::deneme, this, &test::gelen );
     emit deneme("deneme");

}

void test::gelen(QString a) {
    qDebug() << "ADASDAS " << a;
}
