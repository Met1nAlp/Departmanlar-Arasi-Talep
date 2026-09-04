// src/infrastructure/mepsanServer/userValidityCheck.ts
//
// USER_DELETED broadcast'i (bkz. instance.ts) backend'de HENÜZ yok — Barış
// eklemeden o yol hiç tetiklenmiyor, yani "kullanıcı silinince anında logout"
// bugüne kadar PRATİKTE hiç çalışmıyordu. Bu dosya, backend'den ayrı bir
// eklentiye ihtiyaç duymayan, ŞİMDİ çalışan bir yedek yol sağlıyor: zaten var
// olan CARD_LOGIN komutunu, oturum açmış kullanıcının kendi cardUid'i ile
// periyodik olarak tekrar gönderip "sunucu bu kartı hâlâ tanıyor mu" diye
// soruyoruz. Sunucu "not_found" derse (kart/kullanıcı artık yok), oturumu
// anında kapatıyoruz. Rol farkı yok — saha personeli/uretim_yoneticisi,
// departman_yetkilisi, yonetici hepsi cardUid ile giriş yaptığı için aynı
// kontrolden geçiyor.

import { AppState, Alert, type AppStateStatus } from 'react-native';
import { mepsanServerClient } from './instance';
import { parseCardLoginResponse, type CardLoginRawResponse } from './mappers';
import { useAuthStore } from '../../store/authStore';

const CHECK_INTERVAL_MS = 60_000; // 1 dakika

async function checkCurrentUserStillExists(): Promise<void> {
  const user = useAuthStore.getState().currentUser;
  if (!user || !user.cardUid) return;
  if (mepsanServerClient.getState() !== 'CONNECTED') return; // offline'ken kontrol etmenin anlamı yok

  console.log('[AUTH] kullanıcı hâlâ geçerli mi kontrol ediliyor:', user.id);
  try {
    const response = await mepsanServerClient.send('CARD_LOGIN', { nfc_uid: user.cardUid });
    const result = parseCardLoginResponse(response as CardLoginRawResponse, user.cardUid);
    console.log('[AUTH] geçerlilik kontrolü sonucu:', result.outcome);

    if (result.outcome === 'not_found') {
      // Hâlâ oturum açmış görünen kullanıcı için sunucu artık kartı tanımıyor
      // — silinmiş demektir. Kontrol sırasında currentUser değişmiş olabilir
      // (örn. arada logout olmuş), o yüzden son anda tekrar bakıyoruz.
      if (useAuthStore.getState().currentUser?.id === user.id) {
        console.log('[AUTH] kullanıcı artık sunucuda yok, logout ediliyor:', user.id);
        useAuthStore.getState().logout();
        Alert.alert('Hesabınız kaldırıldı', 'Hesabınız sistemden kaldırıldı. Devam etmek için tekrar giriş yapmanız gerekiyor.');
      }
    }
    // 'error' ise (geçici sunucu hatası, örn. DB'ye erişilemedi) sessizce yok
    // sayılır — kullanıcıyı gerçek bir silinme olmadan dışarı atmayalım.
  } catch (err) {
    console.log('[AUTH] geçerlilik kontrolü başarısız (ağ hatası):', err instanceof Error ? err.message : err);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

/**
 * Oturum açıkken periyodik olarak (ve uygulama ön plana her geldiğinde)
 * kullanıcının hâlâ sunucuda kayıtlı olup olmadığını kontrol eder.
 * RootNavigator'dan currentUser var olduğu sürece çağrılmalı, cleanup
 * fonksiyonu logout/unmount'ta çağrılmalı.
 */
export function startUserValidityCheck(): () => void {
  if (intervalId) return () => {}; // zaten çalışıyor

  intervalId = setInterval(() => {
    void checkCurrentUserStillExists();
  }, CHECK_INTERVAL_MS);

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') void checkCurrentUserStillExists();
  };
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  // Başlangıçta da bir kere kontrol et — bağlantı zaten kurulmuşsa beklemeden.
  void checkCurrentUserStillExists();

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}
