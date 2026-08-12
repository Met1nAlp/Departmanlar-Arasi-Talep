import { View, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { colors, spacing, typography } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';

// GEÇİCİ mock veri
const mockRequests: Request[] = [
  { id: 'r1', requesterId: 'u1', departmentId: 'dep-1', productId: 'p1', quantity: 3, status: 'TALEP_ALINDI', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r3', requesterId: 'u2', departmentId: 'dep-1', productId: 'p3', quantity: 5, status: 'HAZIRLANIYOR', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
];
const mockProductNames: Record<string, string> = { p1: 'Vida Seti M6', p3: 'Somun Paketi' };

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={mockRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={mockProductNames[item.productId]}
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Gelen talep yok
          </Text>
        }
      />
    </View>
  );
}