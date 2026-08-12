// src/screens/saha-personeli/QRScanScreen.tsx
// NOT: expo-camera ile gerçek QR okuma Faz 2'de bağlanacak.
// Şimdilik kamera izni + adet giriş akışının UI iskeleti.
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { colors, spacing, typography, radius } from '../../constants/theme';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'QRScan'>;
type Rt = RouteProp<SahaPersoneliStackParamList, 'QRScan'>;

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');

  const handleMockScan = () => setScannedCode('QR-VIDA-M6-001');

  const handleSubmit = () => {
    // Faz 2'de: api.createRequest({ departmentId: route.params.departmentId, qrCode: scannedCode, quantity })
    navigation.navigate('RequestCreated', { requestId: 'r-yeni' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          {scannedCode ? `Okunan kod: ${scannedCode}` : 'Kamera burada görünecek (expo-camera)'}
        </Text>
        {!scannedCode && (
          <TouchableOpacity style={styles.scanButton} onPress={handleMockScan}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>QR Okut (test)</Text>
          </TouchableOpacity>
        )}
      </View>

      {scannedCode && (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Adet</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Talebi Oluştur</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.md },
  cameraPlaceholder: {
    height: 300,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  scanButton: {
    marginTop: spacing.md,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: colors.blue,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});