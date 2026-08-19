# Maestro E2E Akışları

Plan Bölüm 19 "Test Stratejisi": Jest birim/entegrasyon testlerinin (`src/**/__tests__`, `npm test`) üzerine, gerçek cihaz/emülatörde uçtan uca akışları doğrulamak için Maestro kullanılır.

## Kurulum (bir kez)

```powershell
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

Windows'ta WSL veya Git Bash üzerinden çalıştırın; kurulumdan sonra yeni bir terminal açın.

## Çalıştırma

Uygulama derlenmiş ve emülatör/cihazda kurulu olmalı (dev-client build, bkz. `npx expo run:android`).

```bash
maestro test .maestro
```

Tek bir akış için:

```bash
maestro test .maestro/login-and-pin-session.yaml
```

## Akışlar

- `device-enroll.yaml` — temiz kurulumda Cihaz Kaydı ekranı ve geçerli kod ile geçiş (Plan §14.2 adım 1).
- `login-and-pin-session.yaml` — yetkili girişi + personel PIN oturumu (Plan §14.2 adım 2-3). `device-enroll.yaml`'ı `runFlow` ile önce çalıştırır.
- `create-request.yaml` — "+" ile yeni talep başlatma, departman seçimi (Plan §12.4). Kamera okuma Maestro'da simüle edilemediğinden QRScan ekranına ulaşmayı doğrular; `createRequest`/outbox mantığı Jest tarafında birim test edilir.

## Notlar

- Mock kullanıcı bilgileri `src/mocks/users.ts`'ten alınır (`kemal.t` / `mepsan123`, personel PIN `1234`). Gerçek backend'e geçildiğinde bu akışların da güncellenmesi gerekir.
- Ekranlardaki `testID` değerleri Maestro selector'ları için eklendi (örn. `login-username-input`, `pin-key-1`, `device-enroll-submit`) — yeni ekran/bileşen eklerken kritik etkileşim noktalarına `testID` eklemeyi unutmayın.
