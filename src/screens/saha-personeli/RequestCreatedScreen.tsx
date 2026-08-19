// src/screens/saha-personeli/RequestCreatedScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'RequestCreated'>;

export default function RequestCreatedScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.checkCircle}>
        <Text style={{ color: colors.white, fontSize: 32 }}>✓</Text>
      </View>
      <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
        Talebiniz Oluşturuldu
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
        İlgili departmana anlık bildirim gönderildi. Durumu ana ekrandan takip edebilirsiniz.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={{ color: colors.white, fontWeight: '600' }}>Ana Ekrana Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.blue, justifyContent: 'center', alignItems: 'center',
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});