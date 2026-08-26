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
import { spacing } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <Box style={{ flex: 1 }} background="white" padding="lg">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Box
          background="white"
          style={{
            width: scale(200),
            height: scale(200),
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Logo size={140} />
        </Box>
        <Text variant="h1" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
          Mepsan MTS
        </Text>
        <Text variant="body" color="textMuted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Departmanlar arası malzeme talebi{'\n'}tek dokunuşla
        </Text>
      </View>
      <Button
        label="Başla"
        onPress={() => navigation.navigate('CardLogin')}
        style={{ marginBottom: insets.bottom + spacing.md }}
      />
    </Box>
  );
}