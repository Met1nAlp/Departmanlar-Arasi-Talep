import { View, FlatList, Text } from 'react-native';
import { Request } from '../../types';
import { colors, spacing, typography } from '../../constants/theme';
import RequestCard from '../../components/RequestCard';

// GEÇİCİ mock veri — tüm departmanlardan tüm talepler
const mockRequests: Request[] = [
  { id: 'r1', requesterId: 'u1', departmentId: 'dep-1', productId: 'p1', quantity: 3, status: 'TALEP_ALINDI', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r2', requesterId: 'u2', departmentId: 'dep-2', productId: 'p2', quantity: 1, status: 'YOLDA', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
  { id: 'r3', requesterId: 'u3', departmentId: 'dep-1', productId: 'p3', quantity: 5, status: 'TESLIM_EDILDI', deliveryMethod: 'elektrikli_transpalet', createdAt: new Date().toISOString() },
];
const mockProductNames: Record<string, string> = { p1: 'Vida Seti M6', p2: 'Kablo Kanalı 2m', p3: 'Somun Paketi' };

export default function AllRequestsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={mockRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <RequestCard request={item} productName={mockProductNames[item.productId]} />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            Kayıtlı talep yok
          </Text>
        }
      />
    </View>
  );
}