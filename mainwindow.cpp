#include "mainwindow.h"
#include <QApplication>
#include <QDateTime>
#include <QDialog>
#include <QDialogButtonBox>
#include <QFont>
#include <QFormLayout>
#include <QGroupBox>
#include <QHBoxLayout>
#include <QHeaderView>
#include <QJsonArray>
#include <QJsonObject>
#include <QMap>
#include <QMessageBox>
#include <QRegularExpression>
#include <QSplitter>
#include <QTabWidget>
#include <QVBoxLayout>

static const QMap<QString, QString> ROLE_LABELS = {
    {"uretim_yoneticisi",      QString::fromUtf8("\xc3\x9cretim Y\xc3\xb6neticisi")},
    {"departman_yetkilisi", QString::fromUtf8("Departman Yetkilisi")},
    {"yonetici",            QString::fromUtf8("Y\xc3\xb6netici")},
};

static const QMap<QString, QString> DEPT_LABELS = {
    {"elektronik_uretim", QString::fromUtf8("Elektronik \xc3\x9cretim")},
    {"sac_atolyesi",      QString::fromUtf8("Sac At\xc3\xb6lyesi")},
    {"talasli_imalat",    QString::fromUtf8("Tala\xc5\x9fl\xc4\xb1 \xc4\xb0malat")},
};

static QString roleLabel(const QString &key) { return ROLE_LABELS.value(key, key); }
static QString deptLabel(const QString &key) { return DEPT_LABELS.value(key, key); }

static QString roleKeyFromLabel(const QString &label) {
    for (auto it = ROLE_LABELS.constBegin(); it != ROLE_LABELS.constEnd(); ++it)
        if (it.value() == label) return it.key();
    return label;
}
static QString deptKeyFromLabel(const QString &label) {
    for (auto it = DEPT_LABELS.constBegin(); it != DEPT_LABELS.constEnd(); ++it)
        if (it.value() == label) return it.key();
    return label;
}

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
  setWindowTitle("Mepsan Sunucu Kontrol Paneli");
  setMinimumSize(1000, 650);

  settings = new QSettings(QApplication::applicationDirPath() + "/server_config.ini",
                            QSettings::IniFormat, this);
  if (!settings->contains("Network/Port")) {
    settings->setValue("Network/Port", 1234);
  }

  dbManager.connectToDatabase();
  setupUi();
  startServer();
  refreshDeviceTable();
  refreshRequestTable();
  refreshInventoryTable();
  refreshPersonnelTable();
  refreshPendingTable();

  QTimer *autoRefreshTimer = new QTimer(this);
  connect(autoRefreshTimer, &QTimer::timeout, this, [this](){
      refreshDeviceTable();
      refreshRequestTable();
      refreshInventoryTable();
      refreshPersonnelTable();
      refreshPendingTable();
  });
  autoRefreshTimer->start(60000);
}

MainWindow::~MainWindow() {}

void MainWindow::setupUi() {
  QWidget *central = new QWidget(this);
  setCentralWidget(central);

  QVBoxLayout *mainLayout = new QVBoxLayout(central);
  mainLayout->setContentsMargins(8, 8, 8, 8);
  mainLayout->setSpacing(6);

  statusLabel = new QLabel("● Sunucu başlatılıyor...", this);
  statusLabel->setStyleSheet("color: #e67e22; font-weight: bold; font-size: 13px;");
  mainLayout->addWidget(statusLabel);

  QTabWidget *tabs = new QTabWidget(this);
  mainLayout->addWidget(tabs);

  {
    QWidget     *tab    = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(10, 10, 10, 10);

    QGroupBox   *addBox   = new QGroupBox("Yeni Cihaz Ekle (Whitelist)");
    QHBoxLayout *formRow  = new QHBoxLayout(addBox);

    macInput = new QLineEdit();
    macInput->setPlaceholderText("Seri Numarası  (örn: SR-90123)");
    macInput->setMinimumWidth(220);

    nameInput = new QLineEdit();
    nameInput->setPlaceholderText("Cihaz Adı  (örn: Depo Tablet 1)");
    nameInput->setMinimumWidth(180);

    addBtn = new QPushButton("➕  Ekle");
    addBtn->setStyleSheet("background:#27ae60; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");

    formRow->addWidget(macInput);
    formRow->addWidget(nameInput);
    formRow->addWidget(addBtn);
    formRow->addStretch();
    layout->addWidget(addBox);

    deviceTable = new QTableWidget(0, 6);
    deviceTable->setHorizontalHeaderLabels(
        {"Seri Numarası", "Cihaz Adı", "Son IP", "Son Kullanıcı",
         "Son İşlem", "Son Görülme"});

    QHeaderView *dh = deviceTable->horizontalHeader();
    dh->setSectionResizeMode(QHeaderView::ResizeToContents);
    dh->setSectionResizeMode(4, QHeaderView::Stretch);

    deviceTable->setWordWrap(true);
    deviceTable->verticalHeader()->setSectionResizeMode(QHeaderView::ResizeToContents);
    deviceTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    deviceTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    deviceTable->setAlternatingRowColors(true);
    deviceTable->verticalHeader()->setVisible(false);
    layout->addWidget(deviceTable);

    removeBtn = new QPushButton("🗑  Seçili Cihazı Sil");
    removeBtn->setStyleSheet("background:#e74c3c; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");
    layout->addWidget(removeBtn, 0, Qt::AlignLeft);

    tabs->addTab(tab, "🖥  Cihaz Yönetimi");

    connect(addBtn,    &QPushButton::clicked, this, &MainWindow::onAddDevice);
    connect(removeBtn, &QPushButton::clicked, this, &MainWindow::onRemoveDevice);
  }

  {
    QWidget     *tab    = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(10, 10, 10, 10);

    logView = new QTextEdit();
    logView->setReadOnly(true);
    logView->setFont(QFont("Monospace", 9));
    logView->setStyleSheet("background:#1e1e1e; color:#d4d4d4;");
    layout->addWidget(logView);

    clearLogBtn = new QPushButton("🧹  Log Temizle");
    clearLogBtn->setStyleSheet("padding:5px 16px;");
    layout->addWidget(clearLogBtn, 0, Qt::AlignRight);

    tabs->addTab(tab, "📋  Canlı Log");

    connect(clearLogBtn, &QPushButton::clicked, this, &MainWindow::onClearLog);
  }

  {
    QWidget     *tab    = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(10, 10, 10, 10);

    requestTable = new QTableWidget(0, 7);
    requestTable->setHorizontalHeaderLabels(
        {"Sipariş ID", "Talep Eden", "Departman", "Ürün", "Adet", "Durum", "Oluşturulma"});
    requestTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    requestTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    requestTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    requestTable->setAlternatingRowColors(true);
    requestTable->verticalHeader()->setVisible(false);
    layout->addWidget(requestTable);

    refreshRequestBtn = new QPushButton("🔄  Yenile");
    refreshRequestBtn->setStyleSheet("padding:5px 16px;");

    cancelRequestBtn = new QPushButton("❌  Seçili Siparişi İptal Et");
    cancelRequestBtn->setStyleSheet("background:#f39c12; color:white; font-weight:bold; padding:5px 16px; border-radius:4px;");

    QPushButton *deleteRequestBtn = new QPushButton("🗑  Tamamen Sil");
    deleteRequestBtn->setStyleSheet("background:#e74c3c; color:white; font-weight:bold; padding:5px 16px; border-radius:4px;");

    QHBoxLayout *reqBtnLayout = new QHBoxLayout();
    reqBtnLayout->addWidget(cancelRequestBtn);
    reqBtnLayout->addWidget(deleteRequestBtn);
    reqBtnLayout->addStretch();
    reqBtnLayout->addWidget(refreshRequestBtn);

    layout->addLayout(reqBtnLayout);

    tabs->addTab(tab, "📦  Açık Siparişler");

    connect(refreshRequestBtn, &QPushButton::clicked, this, &MainWindow::refreshRequestTable);
    connect(cancelRequestBtn,  &QPushButton::clicked, this, &MainWindow::onCancelRequest);

    connect(deleteRequestBtn, &QPushButton::clicked, this, [this]() {
        int row = requestTable->currentRow();
        if (row < 0) {
            QMessageBox::information(this, "Bilgi", "Lütfen tamamen silmek istediğiniz talebi seçin.");
            return;
        }

        QString reqId = requestTable->item(row, 0)->text();
        auto ans = QMessageBox::question(this, "Kalıcı Silme Onayı",
                                         QString("%1 numaralı talebi veritabanından TAMAMEN silmek istiyor musunuz?\n\nBu işlem geri alınamaz!").arg(reqId),
                                         QMessageBox::Yes | QMessageBox::No);
        if (ans == QMessageBox::Yes) {
            bool wasPreparing = false;
            if (dbManager.deleteRequest(reqId, wasPreparing)) {
                onLogReceived(QString("[TALEPLER] Talep kalıcı olarak silindi: %1").arg(reqId));
                refreshRequestTable();
                QMessageBox::information(this, "Başarılı", "Talep veritabanından kalıcı olarak silindi.");
            } else {
                QMessageBox::critical(this, "Hata", "Talep silinemedi. Lütfen veritabanı bağlantısını kontrol edin.");
            }
        }
    });
  }

  {
    QWidget     *tab    = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(10, 10, 10, 10);

    inventoryTable = new QTableWidget(0, 6);
    inventoryTable->setHorizontalHeaderLabels(
        {"QR Kod", "Eşya Adı", "Departman", "Adet", "Durum", "Zimmetli Kişi"});
    inventoryTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    inventoryTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    inventoryTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    inventoryTable->setAlternatingRowColors(true);
    inventoryTable->verticalHeader()->setVisible(false);
    layout->addWidget(inventoryTable);

    refreshInventoryBtn = new QPushButton("🔄  Yenile");
    refreshInventoryBtn->setStyleSheet("padding:5px 16px;");
    layout->addWidget(refreshInventoryBtn, 0, Qt::AlignRight);

    tabs->addTab(tab, "🏷️  Zimmet (Envanter API)");

    connect(refreshInventoryBtn, &QPushButton::clicked, this, &MainWindow::refreshInventoryTable);
  }

  {
    QWidget     *tab    = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(10, 10, 10, 10);

    QGroupBox   *addBox  = new QGroupBox("Yeni Personel Ekle (NFC Kart Tanımla)");
    QHBoxLayout *formRow = new QHBoxLayout(addBox);

    nfcInput = new QLineEdit();
    nfcInput->setPlaceholderText("NFC Kart UID  (örn: 04:A1:B2:C3)");
    nfcInput->setMinimumWidth(180);

    personnelNameInput = new QLineEdit();
    personnelNameInput->setPlaceholderText("Ad Soyad");
    personnelNameInput->setMinimumWidth(140);

    personnelDeptInput = new QComboBox();
    for (auto it = DEPT_LABELS.constBegin(); it != DEPT_LABELS.constEnd(); ++it)
        personnelDeptInput->addItem(it.value(), it.key());
    personnelDeptInput->setMinimumWidth(140);

    personnelRoleInput = new QComboBox();
    for (auto it = ROLE_LABELS.constBegin(); it != ROLE_LABELS.constEnd(); ++it)
        personnelRoleInput->addItem(it.value(), it.key());
    personnelRoleInput->setMinimumWidth(140);

    connect(personnelRoleInput, QOverload<int>::of(&QComboBox::currentIndexChanged), this, [this](int index) {
            if (!personnelRoleInput || !personnelDeptInput || index < 0) return;

            QString roleKey = personnelRoleInput->itemData(index).toString();
            if (roleKey == "uretim_yoneticisi") {
                personnelDeptInput->setEnabled(false);
                personnelDeptInput->setCurrentIndex(-1);
            } else {
                personnelDeptInput->setEnabled(true);
                if (personnelDeptInput->currentIndex() < 0) {
                    personnelDeptInput->setCurrentIndex(0);
                }
            }
        });

    addPersonnelBtn = new QPushButton("➕  Ekle");
    addPersonnelBtn->setStyleSheet("background:#2980b9; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");

    formRow->addWidget(nfcInput);
    formRow->addWidget(personnelNameInput);
    formRow->addWidget(personnelDeptInput);
    formRow->addWidget(personnelRoleInput);
    formRow->addWidget(addPersonnelBtn);
    formRow->addStretch();
    layout->addWidget(addBox);

    personnelTable = new QTableWidget(0, 5);
    personnelTable->setHorizontalHeaderLabels(
        {"ID", "NFC UID", "Ad Soyad", "Departman", "Rol"});
    personnelTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    personnelTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    personnelTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    personnelTable->setAlternatingRowColors(true);
    personnelTable->verticalHeader()->setVisible(false);
    layout->addWidget(personnelTable);

    QHBoxLayout *personnelBtnRow = new QHBoxLayout();

    removePersonnelBtn = new QPushButton("🗑  Seçili Personeli Sil");
    removePersonnelBtn->setStyleSheet("background:#e74c3c; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");

    editPersonnelBtn = new QPushButton("✏️  Seçili Personeli Düzenle");
    editPersonnelBtn->setStyleSheet("background:#f39c12; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");

    personnelBtnRow->addWidget(removePersonnelBtn);
    personnelBtnRow->addWidget(editPersonnelBtn);
    personnelBtnRow->addStretch();
    layout->addLayout(personnelBtnRow);

    QLabel *pendingLabel = new QLabel("📋 Onay Bekleyen / Kaydedilmemiş Kartlar Havuzu");
    pendingLabel->setStyleSheet("font-weight: bold; color: #e74c3c; margin-top: 10px;");
    layout->addWidget(pendingLabel);

    pendingTable = new QTableWidget(0, 3);
    pendingTable->setHorizontalHeaderLabels({"NFC UID", "Ad (Varsa)", "Son Okutulma Zamanı"});
    pendingTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    pendingTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    pendingTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    pendingTable->setAlternatingRowColors(true);
    pendingTable->verticalHeader()->setVisible(false);
    pendingTable->setMaximumHeight(150);
    layout->addWidget(pendingTable);

    QHBoxLayout *pendingBtnsLayout = new QHBoxLayout();

    approveCardBtn = new QPushButton("✅  Seçili Kartı Personele Dönüştür (Onayla)");
    approveCardBtn->setStyleSheet("background:#27ae60; color:white; font-weight:bold; padding:6px 18px; border-radius:4px;");

    QPushButton *refreshPendingBtn = new QPushButton("🔄 Yenile");
    refreshPendingBtn->setStyleSheet("padding:6px 18px; font-weight:bold;");

    pendingBtnsLayout->addWidget(approveCardBtn);
    pendingBtnsLayout->addWidget(refreshPendingBtn);
    pendingBtnsLayout->addStretch();

    layout->addLayout(pendingBtnsLayout);

    connect(approveCardBtn, &QPushButton::clicked, this, &MainWindow::onApprovePendingCard);
    connect(refreshPendingBtn, &QPushButton::clicked, this, &MainWindow::refreshPendingTable);

    tabs->addTab(tab, "👤  Personel Yönetimi");

    connect(addPersonnelBtn,    &QPushButton::clicked, this, &MainWindow::onAddPersonnel);
    connect(removePersonnelBtn, &QPushButton::clicked, this, &MainWindow::onRemovePersonnel);
    connect(editPersonnelBtn,   &QPushButton::clicked, this, &MainWindow::onEditPersonnel);
  }
}

void MainWindow::startServer() {
  quint16 port = settings->value("Network/Port", 1234).toUInt();
  server = new ServerHandler(port, this);

  connect(server, &ServerHandler::logReceived,      this, &MainWindow::onLogReceived);
  connect(server, &ServerHandler::deviceTableChanged, this, &MainWindow::onDeviceTableChanged);
  connect(server, &ServerHandler::requestTableChanged, this, &MainWindow::refreshRequestTable);

  statusLabel->setText(QString("● Sunucu çalışıyor — Port: %1").arg(port));
  statusLabel->setStyleSheet("color:#27ae60; font-weight:bold; font-size:13px;");
}

void MainWindow::onAddDevice() {
  QString mac  = macInput->text().trimmed().toUpper();
  QString name = nameInput->text().trimmed();

  if (name.isEmpty()) {
    QMessageBox::warning(this, "Hata", "Cihaz adı boş olamaz.");
    return;
  }

  if (dbManager.addToWhitelist(mac, name)) {
    onLogReceived(QString("[WHITELIST] Cihaz eklendi: %1  (%2)").arg(mac, name));
    macInput->clear();
    nameInput->clear();
    refreshDeviceTable();
  } else {
    QMessageBox::critical(this, "Hata", "Cihaz eklenemedi. Bu Seri No zaten kayıtlı olabilir.");
  }
}

void MainWindow::onRemoveDevice() {
  int row = deviceTable->currentRow();
  if (row < 0) {
    QMessageBox::information(this, "Bilgi", "Lütfen silmek istediğiniz cihazı seçin.");
    return;
  }

  QString mac = deviceTable->item(row, 0)->text();
  auto ans = QMessageBox::question(this, "Emin misiniz?",
                                   QString("%1 Seri Numaralı cihazı silmek istiyor musunuz?").arg(mac));
  if (ans == QMessageBox::Yes) {
    if (dbManager.removeDevice(mac)) {
      onLogReceived(QString("[WHITELIST] Cihaz silindi: %1").arg(mac));
      refreshDeviceTable();
    }
  }
}

void MainWindow::onLogReceived(const QString &message) {
  QString timestamp = QDateTime::currentDateTime().toString("[hh:mm:ss] ");
  logView->append(timestamp + message);
}

void MainWindow::onDeviceTableChanged() {
  refreshDeviceTable();
  refreshInventoryTable();
}

void MainWindow::onClearLog() {
  logView->clear();
}

void MainWindow::refreshDeviceTable() {
  QJsonArray devices = dbManager.getAllDevices();
  deviceTable->setRowCount(0);

  for (const auto &val : devices) {
    QJsonObject obj = val.toObject();
    int row = deviceTable->rowCount();
    deviceTable->insertRow(row);
    deviceTable->setItem(row, 0, new QTableWidgetItem(obj["serial_number"].toString()));
    deviceTable->setItem(row, 1, new QTableWidgetItem(obj["device_name"].toString()));
    deviceTable->setItem(row, 2, new QTableWidgetItem(obj["last_ip"].toString()));
    deviceTable->setItem(row, 3, new QTableWidgetItem(obj["last_user"].toString()));
    deviceTable->setItem(row, 4, new QTableWidgetItem(obj["last_action"].toString()));
    deviceTable->setItem(row, 5, new QTableWidgetItem(obj["last_seen_at"].toString()));
  }
}

void MainWindow::refreshRequestTable() {
  QJsonArray reqs = dbManager.getRequests();
  requestTable->setRowCount(0);

  QMap<QString, QString> personnelMap;
  QJsonArray personnel = dbManager.getAllPersonnel();
  for (const auto &p : personnel) {
      QJsonObject pObj = p.toObject();
      personnelMap[pObj["nfc_uid"].toString()] = pObj["name"].toString();
      personnelMap[QString::number(pObj["id"].toInt())] = pObj["name"].toString();
  }

  for (const auto &val : reqs) {
    QJsonObject obj = val.toObject();
    int row = requestTable->rowCount();
    requestTable->insertRow(row);
    requestTable->setItem(row, 0, new QTableWidgetItem(obj["id"].toString()));

    QString reqId = obj["requesterId"].toString();
    QString reqName = personnelMap.value(reqId, reqId);
    requestTable->setItem(row, 1, new QTableWidgetItem(reqName));

    QString depId = obj["departmentId"].toString();
    requestTable->setItem(row, 2, new QTableWidgetItem(deptLabel(depId)));

    requestTable->setItem(row, 3, new QTableWidgetItem(obj["productId"].toString()));
    requestTable->setItem(row, 4, new QTableWidgetItem(QString::number(obj["quantity"].toInt())));

    QString status = obj["status"].toString();
    QTableWidgetItem *statusItem = new QTableWidgetItem(status);
    if (status == "TALEP_ALINDI")    statusItem->setBackground(QColor("#f39c12"));
    else if (status == "HAZIRLANIYOR") statusItem->setBackground(QColor("#3498db"));
    else if (status == "HAZIR")      statusItem->setBackground(QColor("#27ae60"));
    else if (status == "YOLDA")      statusItem->setBackground(QColor("#8e44ad"));
    else if (status == "TESLIM_EDILDI") statusItem->setBackground(QColor("#95a5a6"));
    else if (status == "IPTAL_EDILDI")  statusItem->setBackground(QColor("#e74c3c"));
    else if (status == "ESKALASYON")    statusItem->setBackground(QColor("#c0392b"));
    statusItem->setForeground(Qt::white);
    requestTable->setItem(row, 5, statusItem);

    QString rawDate = obj["createdAt"].toString();
    QDateTime dt = QDateTime::fromString(rawDate, Qt::ISODate);
    QString niceDate = dt.isValid() ? dt.toLocalTime().toString("dd.MM.yyyy HH:mm") : rawDate;
    requestTable->setItem(row, 6, new QTableWidgetItem(niceDate));
  }
}

void MainWindow::refreshInventoryTable() {
  QJsonArray items = dbManager.getAllInventoryItems();
  inventoryTable->setRowCount(0);
}

void MainWindow::refreshPendingTable() {
    QJsonArray pendingCards = dbManager.getPendingCards();
      pendingTable->setRowCount(0);

      for (const auto &val : pendingCards) {
        QJsonObject obj = val.toObject();
        int row = pendingTable->rowCount();
        pendingTable->insertRow(row);
        pendingTable->setItem(row, 0, new QTableWidgetItem(obj["nfc_uid"].toString()));
        pendingTable->setItem(row, 1, new QTableWidgetItem(obj["name"].toString()));
        pendingTable->setItem(row, 2, new QTableWidgetItem(obj["last_scanned_at"].toString()));
      }
}

void MainWindow::onApprovePendingCard() {
  int row = pendingTable->currentRow();
  if (row < 0) {
    QMessageBox::information(this, "Bilgi", "Lütfen onaylamak istediğiniz kartı listeden seçin.");
    return;
  }

  QString nfcUid = pendingTable->item(row, 0)->text();
  QString defaultName = pendingTable->item(row, 1)->text();

  QDialog dlg(this);
  dlg.setWindowTitle(QString("Kartı Onayla ve Kaydet — %1").arg(nfcUid));
  dlg.setMinimumWidth(380);

  QFormLayout *form = new QFormLayout(&dlg);
  QLineEdit *nameInput = new QLineEdit(defaultName, &dlg);

  QComboBox *deptInput = new QComboBox(&dlg);
  for (auto it = DEPT_LABELS.constBegin(); it != DEPT_LABELS.constEnd(); ++it)
      deptInput->addItem(it.value(), it.key());

  QComboBox *roleInput = new QComboBox(&dlg);
  for (auto it = ROLE_LABELS.constBegin(); it != ROLE_LABELS.constEnd(); ++it)
      roleInput->addItem(it.value(), it.key());

  if (roleInput->currentData().toString() == "uretim_yoneticisi") {
    deptInput->setEnabled(false);
    deptInput->setCurrentIndex(-1);
  }

  connect(roleInput, QOverload<int>::of(&QComboBox::currentIndexChanged), &dlg, [roleInput, deptInput](int index) {
    if (index < 0) return;
    if (roleInput->itemData(index).toString() == "uretim_yoneticisi") {
      deptInput->setEnabled(false);
      deptInput->setCurrentIndex(-1);
    } else {
      deptInput->setEnabled(true);
      if (deptInput->currentIndex() < 0) {
        deptInput->setCurrentIndex(0);
      }
    }
  });

  form->addRow("NFC UID:", new QLabel(nfcUid, &dlg));
  form->addRow("Ad Soyad:", nameInput);
  form->addRow("Departman:", deptInput);
  form->addRow("Rol:", roleInput);

  QDialogButtonBox *btns = new QDialogButtonBox(
      QDialogButtonBox::Ok | QDialogButtonBox::Cancel, &dlg);
  btns->button(QDialogButtonBox::Ok)->setText("💾  Kaydet ve Aktifleştir");
  form->addRow(btns);

  connect(btns, &QDialogButtonBox::accepted, &dlg, &QDialog::accept);
  connect(btns, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);

  if (dlg.exec() != QDialog::Accepted) return;

  QString name = nameInput->text().trimmed();
  QString dept = deptInput->currentData().toString();
  QString role = roleInput->currentData().toString();

  if (role == "uretim_yoneticisi") {
      dept = "";
  }

  if (name.isEmpty()) {
    QMessageBox::warning(this, "Hata", "Personel adı boş olamaz.");
    return;
  }

  if (dbManager.addPersonnel(nfcUid, name, dept, role)) {
    dbManager.removePendingCard(nfcUid);
    onLogReceived(QString("[PERSONEL ONAY] Havuzdaki kart sisteme kaydedildi: %1 (NFC: %2)").arg(name, nfcUid));
    refreshPendingTable();
    refreshPersonnelTable();
    QMessageBox::information(this, "Başarılı", "Kart onaylandı ve personel olarak sisteme eklendi.");
  } else {
    QMessageBox::critical(this, "Hata", "Personel eklenemedi. Bu NFC UID zaten kayıtlı olabilir.");
  }
}

void MainWindow::onAddPersonnel() {
  QString nfc  = nfcInput->text().trimmed().toUpper();
  QString name = personnelNameInput->text().trimmed();
  QString dept = personnelDeptInput->currentData().toString();
  QString role = personnelRoleInput->currentData().toString();

  if (role == "uretim_yoneticisi") {
      dept = "";
  }

  if (nfc.isEmpty() || name.isEmpty()) {
    QMessageBox::warning(this, "Hata", "NFC UID ve Ad Soyad alanları boş olamaz.");
    return;
  }

  if (dbManager.addPersonnel(nfc, name, dept, role)) {
    onLogReceived(QString("[PERSONEL] Eklendi: %1 | NFC: %2 | Dept: %3").arg(name, nfc, deptLabel(dept)));
    nfcInput->clear();
    personnelNameInput->clear();
    refreshPersonnelTable();
  } else {
    QMessageBox::critical(this, "Hata", "Personel eklenemedi. Bu NFC UID zaten kayıtlı olabilir.");
  }
}

void MainWindow::onRemovePersonnel() {
  int row = personnelTable->currentRow();
  if (row < 0) {
    QMessageBox::information(this, "Bilgi", "Lütfen silmek istediğiniz personeli seçin.");
    return;
  }

  int id = personnelTable->item(row, 0)->text().toInt();
  QString name = personnelTable->item(row, 2)->text();
  auto ans = QMessageBox::question(this, "Emin misiniz?",
                                   QString("%1 personelini silmek istiyor musunuz?").arg(name));
  if (ans == QMessageBox::Yes) {
    if (dbManager.removePersonnel(id)) {
      onLogReceived(QString("[PERSONEL] Silindi: %1").arg(name));
      refreshPersonnelTable();
    }
  }
}

void MainWindow::onEditPersonnel() {
  int row = personnelTable->currentRow();
  if (row < 0) {
    QMessageBox::information(this, "Bilgi", "Lütfen düzenlemek istediğiniz personeli seçin.");
    return;
  }

  int     id   = personnelTable->item(row, 0)->text().toInt();
  QString nfc  = personnelTable->item(row, 1)->text();
  QString name = personnelTable->item(row, 2)->text();
  QString deptKey = deptKeyFromLabel(personnelTable->item(row, 3)->text());
  QString roleKey = roleKeyFromLabel(personnelTable->item(row, 4)->text());

  QDialog dlg(this);
  dlg.setWindowTitle(QString("Personel Düzenle — %1").arg(name));
  dlg.setMinimumWidth(420);

  QFormLayout *form = new QFormLayout(&dlg);
  form->setSpacing(10);
  form->setContentsMargins(16, 16, 16, 16);

  QLineEdit *eNfc  = new QLineEdit(nfc,  &dlg);
  QLineEdit *eName = new QLineEdit(name, &dlg);

  QComboBox *eDept = new QComboBox(&dlg);
  for (auto it = DEPT_LABELS.constBegin(); it != DEPT_LABELS.constEnd(); ++it)
      eDept->addItem(it.value(), it.key());
  int deptIdx = eDept->findData(deptKey);
  if (deptIdx >= 0) eDept->setCurrentIndex(deptIdx);

  QComboBox *eRole = new QComboBox(&dlg);
  for (auto it = ROLE_LABELS.constBegin(); it != ROLE_LABELS.constEnd(); ++it)
      eRole->addItem(it.value(), it.key());
  int roleIdx = eRole->findData(roleKey);
  if (roleIdx >= 0) eRole->setCurrentIndex(roleIdx);

  if (eRole->currentData().toString() == "uretim_yoneticisi") {
    eDept->setEnabled(false);
    eDept->setCurrentIndex(-1);
  }

  connect(eRole, &QComboBox::currentTextChanged, [eRole, eDept]() {
    if (eRole->currentData().toString() == "uretim_yoneticisi") {
      eDept->setEnabled(false);
      eDept->setCurrentIndex(-1);
    } else {
      eDept->setEnabled(true);
      if (eDept->currentIndex() < 0) {
        eDept->setCurrentIndex(0);
      }
    }
  });

  form->addRow("NFC UID:",    eNfc);
  form->addRow("Ad Soyad:",   eName);
  form->addRow("Departman:",  eDept);
  form->addRow("Rol:",        eRole);

  QDialogButtonBox *btns = new QDialogButtonBox(
      QDialogButtonBox::Save | QDialogButtonBox::Cancel, &dlg);
  btns->button(QDialogButtonBox::Save)->setText("💾  Kaydet");
  btns->button(QDialogButtonBox::Save)->setStyleSheet(
      "background:#27ae60; color:white; font-weight:bold; padding:5px 14px;");
  form->addRow(btns);

  connect(btns, &QDialogButtonBox::accepted, &dlg, &QDialog::accept);
  connect(btns, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);

  if (dlg.exec() != QDialog::Accepted) return;

  QString newNfc  = eNfc->text().trimmed().toUpper();
  QString newName = eName->text().trimmed();
  QString newDept = eDept->currentData().toString();
  QString newRole = eRole->currentData().toString();

  if (newRole == "uretim_yoneticisi") {
      newDept = "";
  }

  if (newNfc.isEmpty() || newName.isEmpty()) {
    QMessageBox::warning(this, "Hata", "NFC UID ve Ad Soyad boş olamaz.");
    return;
  }

  if (dbManager.updatePersonnel(id, newNfc, newName, newDept, newRole)) {
    onLogReceived(QString("[PERSONEL] Güncellendi: %1 | NFC: %2 | Dept: %3 | Rol: %4")
                      .arg(newName, newNfc, deptLabel(newDept), roleLabel(newRole)));
    refreshPersonnelTable();
  } else {
    QMessageBox::critical(this, "Hata",
                          "Personel güncellenemedi.\nBu NFC UID başka bir personele kayıtlı olabilir.");
  }
}

void MainWindow::refreshPersonnelTable() {
  QJsonArray personnel = dbManager.getAllPersonnel();
  personnelTable->setRowCount(0);

  for (const auto &val : personnel) {
    QJsonObject obj = val.toObject();
    int row = personnelTable->rowCount();
    personnelTable->insertRow(row);
    personnelTable->setItem(row, 0, new QTableWidgetItem(QString::number(obj["id"].toInt())));
    personnelTable->setItem(row, 1, new QTableWidgetItem(obj["nfc_uid"].toString()));
    personnelTable->setItem(row, 2, new QTableWidgetItem(obj["name"].toString()));

    QString deptKey = obj["department"].toString();
    QTableWidgetItem *deptItem;

    if (deptKey.isEmpty()) {
        deptItem = new QTableWidgetItem("Bağımsız (Saha)");
        deptItem->setBackground(QColor("#7f8c8d"));
    } else {
        deptItem = new QTableWidgetItem(deptLabel(deptKey));
        deptItem->setBackground(QColor("#34495e"));
    }

    deptItem->setForeground(Qt::white);
    personnelTable->setItem(row, 3, deptItem);

    QString roleKey = obj["role"].toString();
    QTableWidgetItem *roleItem = new QTableWidgetItem(roleLabel(roleKey));
    if (roleKey == "yonetici") roleItem->setBackground(QColor("#8e44ad"));
    else if (roleKey == "departman_yetkilisi") roleItem->setBackground(QColor("#e67e22"));
    else roleItem->setBackground(QColor("#27ae60"));
    roleItem->setForeground(Qt::white);
    personnelTable->setItem(row, 4, roleItem);
  }
}

void MainWindow::onCancelRequest() {
  int row = requestTable->currentRow();
  if (row < 0) {
    QMessageBox::information(this, "Bilgi", "Lütfen iptal etmek istediğiniz talebi seçin.");
    return;
  }

  QString reqId = requestTable->item(row, 0)->text();
  QString status = requestTable->item(row, 5)->text();

  if (status == "İptal Edildi" || status == "IPTAL_EDILDI" || status == "TESLIM_EDILDI" || status == "Teslim Edildi") {
    QMessageBox::warning(this, "Hata", "Bu talep zaten kapatılmış veya iptal edilmiş durumda.");
    return;
  }

  auto ans = QMessageBox::question(this, "Emin misiniz?", QString("%1 numaralı talebi iptal etmek istiyor musunuz?").arg(reqId));
  if (ans == QMessageBox::Yes) {
    bool wasPreparing = false;
    QString timeStr = QDateTime::currentDateTime().toString(Qt::ISODate);
    if (dbManager.cancelRequest(reqId, "Sunucu üzerinden iptal edildi.", timeStr, wasPreparing)) {
       refreshRequestTable();
       QMessageBox::information(this, "Başarılı", "Talep başarıyla iptal edildi.");
    } else {
       QMessageBox::warning(this, "Hata", "Talep iptal edilemedi.");
    }
  }
}
