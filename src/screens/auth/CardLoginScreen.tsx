import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { spacing, colors } from '../../design-system/tokens';
import { readCardUid, isNfcSupported, cancelReading } from '../../infrastructure/nfc/NfcReader';
import { mepsanServerClient } from '../../infrastructure/mepsanServer/instance';
import { mapCardLoginResponseToUser } from '../../infrastructure/mepsanServer/mappers';
import { useAuthStore } from '../../store/authStore';

type ScreenState = 'idle' | 'reading' | 'verifying' | 'error' | 'unsupported';

export default function CardLoginScreen() {
  const loginWithCardUser = useAuthStore((s) => s.loginWithCardUser);
  const [state, setState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const startReading = async () => {
    setState('reading');
    setErrorMessage('');
    try {
      const cardUid = await readCardUid();
      setState('verifying');

      // BARIŞ'IN CARD_LOGIN KOMUTU HENÜZ BACKEND'DE YOK — bu çağrı şu an
      // "Bilinmeyen Komut" hatasıyla dönecek. Komut eklenince format burada
      // (mappers.ts ile birlikte) doğrulanıp gerekirse düzeltilecek.
      const response = await mepsanServerClient.send('CARD_LOGIN', { card_uid: cardUid });

      if (response.status !== 'ok' || !response.user) {
        throw new Error(response.message ?? 'Kart tanımlı değil');
      }

      const user = mapCardLoginResponseToUser(response.user as Record<string, unknown>);
      loginWithCardUser(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kart okunamadı');
      setState('error');
    }
  };

  useEffect(() => {
    isNfcSupported().then((supported) => {
      if (!supported) setState('unsupported');
    });
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
          background="blueLight"
          style={{ width: 120, height: 120, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="h1" color="blue">
            NFC
          </Text>
        </Box>

        <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {state === 'reading' && 'Kartınızı okutun...'}
          {state === 'verifying' && 'Doğrulanıyor...'}
          {state === 'error' && 'Giriş başarısız'}
          {state === 'idle' && 'Kartınızı Okutun'}
        </Text>

        {state === 'error' && (
          <Text variant="body" color="danger" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {errorMessage}
          </Text>
        )}

        {(state === 'idle' || state === 'error') && (
          <Button
            label="Kart Okutmayı Başlat"
            onPress={startReading}
            style={{ marginTop: spacing.xl, width: 240 }}
          />
        )}
      </View>
    </Box>
  );
}