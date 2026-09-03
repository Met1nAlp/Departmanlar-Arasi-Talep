QT += core gui websockets network sql widgets

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

CONFIG += c++11
CONFIG -= app_bundle

SOURCES += \
    databasemanager.cpp \
    eventlogger.cpp \
    main.cpp \
    mainwindow.cpp \
    qrprocessor.cpp \
    serverhandler.cpp \
    webapihandler.cpp

HEADERS += \
    databasemanager.h \
    eventlogger.h \
    mainwindow.h \
    qrprocessor.h \
    serverhandler.h \
    webapihandler.h

# Default rules for deployment.
qnx: target.path = /tmp/$${TARGET}/bin
else: unix:!android: target.path = /opt/$${TARGET}/bin
!isEmpty(target.path): INSTALLS += target
