// src/infrastructure/device/deviceIdentifier.ts
//
// Gerçek fabrika seri numarasını okumak Android 8+ / iOS'ta uygulamalara
// kapalı (işletim sistemi kısıtı, MDM/device owner olmadan mümkün değil —
// doğrulandı, bkz. deviceStore.ts dosya başı notu). Bu yüzden "seri numarası"
// olarak, işletim sisteminin kendisinin verdiği, otomatik okunabilen ve
// cihaz başına kalıcı olan bir kimlik kullanıyoruz:
//   - Android: Settings.Secure.ANDROID_ID (getAndroidId — senkron)
//   - iOS: identifierForVendor (getIosIdForVendorAsync — asenkron, ilk
//     denemede null dönebilir, örn. cihaz yeniden başlatılıp henüz kilit
//     açılmamışsa — bu yüzden çağıran taraf null'ı "henüz alınamadı" olarak
//     ele almalı, kalıcı bir hata değil).
//
// Barış'ın veritabanının bunu "seri numarası" olarak kabul etmesi gerekiyor
// — kutu üzerindeki gerçek seri numarasıyla eşleşmez, cihaz+uygulama
// kombinasyonuna özel bir kimliktir.

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import DeviceInfo from 'react-native-device-info';

export async function getAutoDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      return id || null;
    }
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      return id ?? null;
    }
  } catch (error) {
    console.log('[DEVICE] otomatik cihaz kimliği okunamadı:', error instanceof Error ? error.message : error);
  }
  return null; // web/desteklenmeyen platform — elle giriş gerekir
}

/**
 * GEÇİCİ TEŞHİS FONKSİYONU — gerçek fabrika seri numarasını (Build.getSerial())
 * gerçekten denemek için (kullanıcı isteği üzerine, "bir dene ne hata alıyoruz
 * görelim"). react-native-device-info'nun Android native kodu incelendi:
 * Build.getSerial() çağrısını try/catch'e alıp, SecurityException/izin hatası
 * durumunda sessizce "unknown" string'i döndürüyor — yani gerçek bir
 * Exception JS tarafına hiç ulaşmıyor, sonuç doğrudan "unknown" oluyor.
 * Sonuç görüldükten sonra bu fonksiyon ve react-native-device-info paketi
 * KALDIRILABİLİR — kalıcı çözüm zaten getAutoDeviceId() (Android ID).
 */
export async function tryRealSerialNumber(): Promise<{ value: string; error: string | null }> {
  try {
    const value = await DeviceInfo.getSerialNumber();
    return { value, error: null };
  } catch (error) {
    return { value: '', error: error instanceof Error ? error.message : String(error) };
  }
}
