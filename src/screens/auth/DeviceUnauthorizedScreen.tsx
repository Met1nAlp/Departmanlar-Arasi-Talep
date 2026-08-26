import { useState, useEffect } from 'react';
import { View, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { spacing } from '../../design-system/tokens';
import { useDeviceStore } from '../../store/deviceStore';
import { connectMepsanServer } from '../../infrastructure/mepsanServer/instance';

function openDeviceInfoSettings() {
  if (Platform.OS !== 'android') {
    Linking.openSettings();
    return;
  }
  Linking.sendIntent('android.settings.DEVICE_INFO_SETTINGS').catch(() => {
    Linking.sendIntent('android.settings.WIFI_SETTINGS').catch(() => {
      Linking.openSettings();
    });
  });
}

export default function DeviceUnauthorizedScreen() {
  const deviceUid = useDeviceStore((s) => s.deviceUid);
  const setMacAddress = useDeviceStore((s) => s.setMacAddress);
  const clearMacAddress = useDeviceStore((s) => s.clearMacAddress);
  const insets = useSafeAreaInsets();
  
  const [macInput, setMacInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // YENİ: Otomatik denemenin yapılıp yapılmadığını takip eden state
  const [autoCheckDone, setAutoCheckDone] = useState(false);

  // YENİ: Sayfa ilk açıldığında çalışacak otomatik kontrol mekanizması
  useEffect(() => {
    async function performInitialCheck() {
      // Eğer cihazda kayıtlı bir MAC varsa ve henüz otomatik kontrol yapmadıysak:
      if (deviceUid && !autoCheckDone) {
        setIsConnecting(true);
        try {
          await connectMepsanServer();
          // Eğer bağlantı başarılı olursa, state güncellenir ve ana navigasyon 
          // bizi bu sayfadan otomatik olarak atar.
        } catch (error) {
          console.error("Otomatik bağlantı reddedildi:", error);
          // Hata dönerse (sunucu reddederse) aşağıdaki "Yetkisiz" ekranına düşmesi için:
        } finally {
          setIsConnecting(false);
          setAutoCheckDone(true); // Kontrol bitti, artık arayüzü gösterebiliriz.
        }
      } else if (!deviceUid) {
        // Hiç MAC adresi kayıtlı değilse, kontrol etmeye gerek yok direkt formu göster
        setAutoCheckDone(true);
      }
    }

    performInitialCheck();
  }, [deviceUid, autoCheckDone]);

  // EKRAN 1: Yükleniyor / Bağlanıyor durumu
  // Otomatik kontrol bitene kadar VEYA butona basılıp bağlanırken bu ekran görünür
  if (isConnecting || !autoCheckDone) {
    return (
      <Box style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }} background="white">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h2" style={{ textAlign: 'center' }}>
            Sunucuya Bağlanıyor...
          </Text>
          <Text variant="body" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Yetki kontrolü yapılıyor, lütfen bekleyin.
          </Text>
        </View>
      </Box>
    );
  }

  // EKRAN 2: MAC adresi hiç girilmemişse gösterilecek form
  if (!deviceUid) {
    return (
      <Box style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }} background="white">
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="h2" style={{ textAlign: 'center' }}>
            Cihazın MAC Adresini Girin
          </Text>
          <Text variant="body" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Ayarlar → Telefon Hakkında → Durum Bilgileri altındaki Wi-Fi MAC
            Adresini girin.
          </Text>

          <Box style={{ marginTop: spacing.lg }}>
            <TextField
              placeholder="A4:C3:F0:12:34:56"
              value={macInput}
              onChangeText={setMacInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </Box>

          <Button
            label="Telefon Bilgilerini Aç"
            onPress={openDeviceInfoSettings}
            variant="secondary"
            style={{ marginTop: spacing.md, width: '100%' }}
          />
          
          <Button
            label="Kaydet ve Bağlan"
            onPress={async () => {
              setIsConnecting(true);
              await setMacAddress(macInput);
              try {
                await connectMepsanServer();
              } catch (error) {
                console.error("Bağlantı hatası:", error);
              } finally {
                setIsConnecting(false);
              }
            }}
            disabled={macInput.trim().length === 0}
            style={{ marginTop: spacing.sm, width: '100%' }}
          />
        </View>
      </Box>
    );
  }

  // EKRAN 3: MAC var, otomatik kontrol yapıldı ama sunucu reddetti.
  return (
    <Box style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }} background="white">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="h2" style={{ textAlign: 'center' }}>
          Bu cihaz yetkili değil
        </Text>
        <Text variant="body" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
          Aşağıdaki MAC adresinin MEPSAN veritabanına eklendiğinden emin olun.
        </Text>
        <Box background="surface" radius="md" padding="md" style={{ marginTop: spacing.lg, width: '100%' }}>
          <Text variant="bodyBold" style={{ textAlign: 'center' }}>
            {deviceUid}
          </Text>
        </Box>
        <Button
          label="MAC Adresini Değiştir"
          onPress={() => clearMacAddress()}
          variant="secondary"
          style={{ marginTop: spacing.md, width: '100%' }}
        />
        
        <Button
          label="Tekrar Dene"
          onPress={async () => {
            setIsConnecting(true);
            try {
              await connectMepsanServer();
            } catch (error) {
              console.error("Tekrar deneme hatası:", error);
            } finally {
              setIsConnecting(false);
            }
          }}
          style={{ marginTop: spacing.sm, width: '100%' }}
        />
      </View>
    </Box>
  );
}