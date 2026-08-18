// src/screens/saha-personeli/DepartmentSelectScreen.tsx
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { spacing } from '../../design-system/tokens';
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

  if (loading) return <LoadingView />;

  return (
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        Hangi departmandan talep edeceksiniz?
      </Text>
      <ScrollView>
        {departments.map((dep) => (
          <Pressable
            key={dep.id}
            onPress={() => navigation.navigate('QRScan', { departmentId: dep.id })}
            background="surface"
            radius="md"
            style={{
              width: '100%',
              marginBottom: spacing.sm,
              paddingHorizontal: spacing.md,
              justifyContent: 'flex-start',
            }}
            accessibilityLabel={dep.name}
          >
            <Text variant="bodyBold">{dep.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Box>
  );
}