import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { colors, spacing } from '../../design-system/tokens';
import { readCardUid, isNfcSupported, cancelReading } from '../../infrastructure/nfc/NfcReader';
import { mepsanServerClient } from '../../infrastructure/mepsanServer/instance';
import { parseCardLoginResponse, CardLoginRawResponse } from '../../infrastructure/mepsanServer/mappers';
import { useAuthStore } from '../../store/authStore';
import { scale } from '../../design-system/tokens/scale';
import { Logo } from '../../design-system/components/Logo';

type ScreenState = 'reading' | 'verifying' | 'error' | 'not_found' | 'unsupported';


export default function CardLoginScreen() {
  const insets = useSafeAreaInsets();
  const loginWithCardUser = useAuthStore((s) => s.loginWithCardUser);
  const [state, setState] = useState<ScreenState>('reading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startReading = async () => {
    setState('reading');
    try {
      const cardUid = await readCardUid();
      
      console.log('--- NFC OKUMA BAŞARILI ---');
      console.log('Okunan Kart UID:', cardUid);
      const payload = { nfc_uid: cardUid }; // nfc_uid veya card_uid (alt tireli olmalı)
      console.log('Backend\'e giden veri:', payload);
      console.log('--------------------------');

      setState('verifying');

      const response = await mepsanServerClient.send('CARD_LOGIN', payload);
      console.log('[CARD_LOGIN] cevap:', JSON.stringify(response));
      const result = parseCardLoginResponse(response as CardLoginRawResponse, cardUid);

      if (result.outcome === 'success') {
        console.log('[CARD_LOGIN] giriş yapan:', result.user.name, '| rol:', result.user.role, '| departman:', result.user.departmentId ?? '-');
      }

      if (result.outcome !== 'success') {
        setErrorMessage(result.message);
        setState(result.outcome === 'not_found' ? 'not_found' : 'error');
        return;
      }

      loginWithCardUser(result.user);
    } catch (error) {

      console.log('Arka Plan Hatası:', error);
      setErrorMessage('Bağlantı hatası. Lütfen tekrar deneyin.');
      setState('error');
    }
  };

  useEffect(() => {
    isNfcSupported()
      .then((supported) => {
        if (!supported) {
          setState('unsupported');
        } else {
          // startReading asenkron olduğu için dışarı sızabilecek olası hataları yutuyoruz
          startReading().catch(() => {});
        }
      })
      .catch(() => {}); // isNfcSupported içinden sızabilecek hataları da yutuyoruz
    
    return () => {
      cancelReading();
    };
  }, []);

  if (state === 'unsupported') {
    return (
      <Box style={{ flex: 1 }} background="white" padding="lg">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h2" style={{ textAlign: 'center' }}>
            Bu cihaz NFC desteklemiyor
          </Text>
          <Text variant="body" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Kart ile giriş için NFC özellikli bir cihaz gerekiyor.
          </Text>
        </View>
      </Box>
    );
  }

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        
        <Box
          background="white"
          style={{
            width: scale(120),
            height: scale(120),
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: state === 'error' ? 2 : 0,
            borderColor: colors.danger,
          }}
        >
          <Logo size={scale(90)} />
        </Box>

        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {state === 'reading' && 'Kartınızı Okutun...'}
          {state === 'verifying' && 'Doğrulanıyor...'}
          {state === 'error' && 'Giriş Başarısız'}
          {state === 'not_found' && 'Kart Tanımlı Değil'}
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom + spacing.xl, alignItems: 'center', width: '100%' }}>
      {(state === 'error' || state === 'not_found') && (
          <>
            <Button label="Tekrar Dene" onPress={() => startReading().catch(() => {})} style={{ width: '100%', marginBottom: spacing.sm }} />
            <Text variant="bodyBold" color="danger" style={{ textAlign: 'center' }}>
              {errorMessage || 'Kart doğrulanamadı. Lütfen tekrar deneyin.'}
            </Text>
          </>
        )}
      </View>
    </Box>
  );
}
