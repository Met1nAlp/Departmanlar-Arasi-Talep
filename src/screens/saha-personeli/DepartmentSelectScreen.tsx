// src/screens/saha-personeli/DepartmentSelectScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Department } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';

// GEÇİCİ mock veri — Faz 2'de backend'den çekilecek
const departments: Department[] = [
  { id: 'dep-1', name: 'Depo' },
  { id: 'dep-2', name: 'Bakım' },
  { id: 'dep-3', name: 'Elektrik' },
];

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DepartmentSelect'>;

export default function DepartmentSelectScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        Hangi departmandan talep edeceksiniz?
      </Text>
      {departments.map((dep) => (
        <TouchableOpacity
          key={dep.id}
          style={styles.option}
          onPress={() => navigation.navigate('QRScan', { departmentId: dep.id })}
        >
          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{dep.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.md },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});