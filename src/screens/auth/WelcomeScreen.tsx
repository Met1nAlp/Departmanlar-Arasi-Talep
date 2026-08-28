// src/screens/auth/WelcomeScreen.tsx
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Button } from '../../design-system/components/Button';
import { Logo } from '../../design-system/components/Logo';
import { colors, spacing } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blueLight"
        style={{
          height: '48%',
          borderBottomLeftRadius: scale(48),
          borderBottomRightRadius: scale(48),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          background="white"
          style={{
            width: scale(150),
            height: scale(150),
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Logo size={105} />
        </Box>
      </Box>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg }}>
        <Text variant="h1" style={{ textAlign: 'center' }}>
          Mepsan MTS
        </Text>
        <Text variant="body" color="textMuted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Departmanlar arası malzeme talebi{'\n'}tek dokunuşla
        </Text>
      </View>

      <Box padding="lg" style={{ paddingBottom: insets.bottom + spacing.md }}>
        <Button label="Başla" onPress={() => navigation.navigate('CardLogin')} />
      </Box>
    </Box>
  );
}