#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "databasemanager.h"
#include "serverhandler.h"
#include <QComboBox>
#include <QLabel>
#include <QLineEdit>
#include <QMainWindow>
#include <QPushButton>
#include <QSettings>
#include <QTableWidget>
#include <QTextEdit>
#include <QTimer>

class MainWindow : public QMainWindow {
  Q_OBJECT

public:
  explicit MainWindow(QWidget *parent = nullptr);
  ~MainWindow();

private slots:
  void onAddDevice();
  void onRemoveDevice();
  void onLogReceived(const QString &message);
  void onDeviceTableChanged();
  void onCancelRequest();
  void onClearLog();
  void refreshInventoryTable();
  void onAddPersonnel();
  void onRemovePersonnel();
  void onEditPersonnel();
  void refreshPersonnelTable();
  void onApprovePendingCard();
  void refreshPendingTable();

private:
  void setupUi();
  void startServer();
  void refreshDeviceTable();
  void refreshRequestTable();

  // --- Cihaz Yönetimi Sekmesi ---
  QTableWidget *deviceTable;
  QLineEdit    *macInput;
  QLineEdit    *nameInput;
  QPushButton  *addBtn;
  QPushButton  *removeBtn;

  // --- Log Sekmesi ---
  QTextEdit   *logView;
  QPushButton *clearLogBtn;

  // --- Talepler Sekmesi ---
  QTableWidget *requestTable;
  QPushButton  *refreshRequestBtn;
  QPushButton  *cancelRequestBtn;

  // --- Zimmet/Envanter Sekmesi ---
  QTableWidget *inventoryTable;
  QPushButton  *refreshInventoryBtn;

  // --- Personel Sekmesi ---
  QTableWidget *personnelTable;
  QLineEdit    *nfcInput;
  QLineEdit    *personnelNameInput;
  QComboBox    *personnelDeptInput;
  QComboBox    *personnelRoleInput;
  QPushButton  *addPersonnelBtn;
  QPushButton  *removePersonnelBtn;
  QPushButton  *editPersonnelBtn;
  QTableWidget *pendingTable;
  QPushButton *approveCardBtn;

  // --- Sunucu Durumu ---
  QLabel *statusLabel;

  ServerHandler  *server;
  databasemanager dbManager;
  QSettings      *settings;
};

#endif // MAINWINDOW_H
