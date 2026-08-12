import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography, radius } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';

// GEÇİCİ mock veri — Faz 2'de useRequests() hook'u ile değişecek
const mockRequests: Request[] = [
  { id: 'r1', requesterId: 'user-saha_personeli', departmentId: 'dep-1', productId: 'p1', quantity: 3, status: 'HAZIRLANIYOR', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r2', requesterId: 'user-saha_personeli', departmentId: 'dep-2', productId: 'p2', quantity: 1, status: 'YOLDA', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
];

const mockProductNames: Record<string, string> = { p1: 'Vida Seti M6', p2: 'Kablo Kanalı 2m' };

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <FlatList
        data={mockRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={mockProductNames[item.productId]}
            onPress={() => navigation.navigate('RequestTracking', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Henüz talebiniz yok
          </Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('DepartmentSelect')}>
        <Text style={{ color: colors.white, fontSize: 28, lineHeight: 28 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});