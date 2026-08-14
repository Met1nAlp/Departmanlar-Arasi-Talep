// src/screens/saha-personeli/DeliveryConfirmScreen.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { updateRequestStatus } from '../../api/requests';
import { useActiveUser } from '../../store/authStore';
import { canConfirmDelivery } from '../../domain/request/legacyAdapter';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'DeliveryConfirm'>;

export default function DeliveryConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useActiveUser();
  const [confirming, setConfirming] = useState(false);

  // RBAC savunması: bu ekrana yalnızca RequestTrackingScreen'den, yetkili bir
  // rolle geliniyor olması beklenir. Yine de derin bağlantı/rol değişimi gibi
  // durumlara karşı burada da kontrol edilir (bkz. RequestPolicies.canClose).
  const allowed = user ? canConfirmDelivery(user.role) : false;

  const handleConfirm = async () => {
    if (!allowed) return;
    setConfirming(true);
    await updateRequestStatus(route.params.requestId, 'TESLIM_EDILDI');
    setConfirming(false);
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
        Ürünü teslim aldığınızı onaylıyor musunuz?
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
        Onayladığınızda ilgili departmana "Ürün İletildi" bildirimi gönderilecek.
      </Text>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={confirming || !allowed}>
        {confirming ? <ActivityIndicator color={colors.white} /> : (
          <Text style={{ color: colors.white, fontWeight: '600' }}>Evet, Teslim Aldım</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  confirmButton: { marginTop: spacing.xl, backgroundColor: colors.blue, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});