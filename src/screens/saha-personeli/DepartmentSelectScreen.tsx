// src/screens/saha-personeli/DepartmentSelectScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Department } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'DepartmentSelect'>;

export default function DepartmentSelectScreen() {
  const navigation = useNavigation<Nav>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartments().then((deps) => {
      setDepartments(deps);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

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
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
});