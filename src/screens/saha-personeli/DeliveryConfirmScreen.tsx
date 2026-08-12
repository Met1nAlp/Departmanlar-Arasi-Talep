import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();

  const handleConfirm = () => {
    // Faz 2'de: api.updateRequestStatus(requestId, 'TESLIM_EDILDI')
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
        Ürünü teslim aldığınızı onaylıyor musunuz?
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
        Onayladığınızda ilgili departmana "Ürün İletildi" bildirimi gönderilecek.
      </Text>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={{ color: colors.white, fontWeight: '600' }}>Evet, Teslim Aldım</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  confirmButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.blue,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});