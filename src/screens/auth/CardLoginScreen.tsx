// src/screens/auth/CardLoginScreen.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { successFeedback, errorFeedback, cardDetectedFeedback } from '../../design-system/feedback';

type ScreenState = 'reading' | 'verifying' | 'error' | 'not_found' | 'unsupported';

const STATE_SUBTITLES: Partial<Record<ScreenState, string>> = {
  reading: 'Kartınızı telefonun arka yüzüne yaklaştırın',
  verifying: 'Bilgileriniz kontrol ediliyor, lütfen bekleyin',
};

export default function CardLoginScreen() {
  const insets = useSafeAreaInsets();
  const loginWithCardUser = useAuthStore((s) => s.loginWithCardUser);
  const [state, setState] = useState<ScreenState>('reading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startReading = async () => {
    setState('reading');
    try {
      const cardUid = await readCardUid();
      const payload = { nfc_uid: cardUid };

      // Kart algılandığı anda (sunucu cevabı gelmeden ÖNCE) titreşim + ses —
      // kullanıcı kartı hâlâ okuyucuya basılı tutmaya devam etmesin, "Doğrulanıyor"
      // ekranına geçtiğimizi hemen hissetsin.
      void cardDetectedFeedback();
      setState('verifying');

      const response = await mepsanServerClient.send('CARD_LOGIN', payload);
      const result = parseCardLoginResponse(response as CardLoginRawResponse, cardUid);

      if (result.outcome !== 'success') {
        void errorFeedback();
        setErrorMessage(result.message);
        setState(result.outcome === 'not_found' ? 'not_found' : 'error');
        return;
      }

      void successFeedback();
      loginWithCardUser(result.user);
    } catch (error) {
      void errorFeedback();
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
          startReading().catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelReading();
    };
  }, []);

  if (state === 'unsupported') {
    return (
      <Box style={{ flex: 1 }} background="white" padding="lg">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Box
            background="dangerLight"
            style={{ width: scale(80), height: scale(80), borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}
          >
            <Ionicons name="phone-portrait-outline" size={scale(36)} color={colors.danger} />
          </Box>
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

  const isError = state === 'error' || state === 'not_found';

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
          {!isError && (
            <>
              <Box
                style={{
                  position: 'absolute',
                  width: scale(210),
                  height: scale(210),
                  borderRadius: 999,
                  backgroundColor: colors.blueLight,
                  opacity: 0.5,
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  width: scale(170),
                  height: scale(170),
                  borderRadius: 999,
                  backgroundColor: colors.blueLight,
                  opacity: 0.8,
                }}
              />
            </>
          )}
          <Box
            background="white"
            style={{
              width: scale(130),
              height: scale(130),
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isError ? 2 : 0,
              borderColor: colors.danger,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isError ? (
              <Ionicons name="close-circle" size={scale(56)} color={colors.danger} />
            ) : (
              <Logo size={scale(90)} />
            )}
          </Box>
        </View>

        <Text variant="h1" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {state === 'reading' && 'Kartınızı Okutun'}
          {state === 'verifying' && 'Doğrulanıyor'}
          {state === 'error' && 'Giriş Başarısız'}
          {state === 'not_found' && 'Kart Tanımlı Değil'}
        </Text>

        <Text variant="body" color={isError ? 'danger' : 'textMuted'} style={{ marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg }}>
          {isError ? (errorMessage || 'Kart doğrulanamadı. Lütfen tekrar deneyin.') : STATE_SUBTITLES[state]}
        </Text>
      </View>

      {isError && (
        <View style={{ paddingBottom: insets.bottom + spacing.md, width: '100%' }}>
          <Button label="Tekrar Dene" onPress={() => startReading().catch(() => {})} />
        </View>
      )}
    </Box>
  );
}