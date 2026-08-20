import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Request } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { StatusChip } from '../../design-system/components/StatusChip';
import { PriorityBadge, Priority } from '../../design-system/components/PriorityBadge';
import { EmptyState } from '../../design-system/components/EmptyState';
import { LoadingView } from '../../design-system/components/LoadingView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { getRequests } from '../../api/requests';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'IncomingRequests'>;

// GEÇİCİ: gerçek priority alanı Request tipinde henüz yok (Efe'nin E1
// maddesi). Bu fonksiyon, talebin id'sine göre SABİT (aynı talep hep aynı
// rengi alır) ama SAHTE bir öncelik üretiyor — sadece görsel çeşitliliği
// test etmek için. Gerçek priority alanı gelince TAMAMEN SİLİNECEK,
// item.priority doğrudan kullanılacak.
function getTempFakePriority(requestId: string): Priority {
  const priorities: Priority[] = ['LINE_DOWN', 'URGENT', 'NORMAL', 'PLANNED'];
  let hash = 0;
  for (let i = 0; i < requestId.length; i++) hash += requestId.charCodeAt(i);
  return priorities[hash % priorities.length];
}

const priorityColors: Record<Priority, keyof typeof colors> = {
  LINE_DOWN: 'danger',
  URGENT: 'warning',
  NORMAL: 'blue',
  PLANNED: 'textMuted',
};

// GERÇEK veri — sahte SLA süresi yerine, elimizdeki tek gerçek zaman
// bilgisinden (createdAt) hesaplanıyor.
function getRelativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  return `${Math.floor(diffMin / 60)} sa önce`;
}

export default function IncomingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    Promise.all([getRequests({ departmentId: user.departmentId }), getDepartments()]).then(
      async ([reqs, departments]) => {
        setRequests(reqs);
        setDepartmentName(departments.find((d) => d.id === user.departmentId)?.name ?? '');
        const productList = await getProductsByIds(reqs.map((r) => r.productId));
        setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
        setLoading(false);
      }
    );
  }, [user]);

  if (loading) return <LoadingView />;

  const queue = requests.filter((r) => r.status !== 'TESLIM_EDILDI');
  const sortedRequests = [...queue].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // GERÇEK sayılar — mevcut status alanından, uydurma yok.
  const receivedCount = queue.filter((r) => r.status === 'TALEP_ALINDI').length;
  const preparingCount = queue.filter((r) => r.status === 'HAZIRLANIYOR').length;

  return (
    <Box style={{ flex: 1 }} background="white">
      <Box
        background="blue"
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
        }}
      >
        {/* Üst satır: departman adı + ikon butonlar — HomeScreen'deki Ayarlar
            butonuyla aynı stil (mavi daire) kullanılıyor, tutarlılık için. */}
        <Stack direction="row" justify="space-between" align="center">
            <Text variant="bodyBold" color="white" style={{ opacity: 0.85, letterSpacing: 1 , fontSize: 30}}>
            {departmentName.toUpperCase()}
          </Text>
          <Stack direction="row" gap="sm">
            <Pressable
              onPress={() => navigation.navigate('MaterialRequestQueue')}
              background="blueMedium"
              style={{ borderRadius: 999 }}
              accessibilityLabel="Çok kalemli talepler"
            >
              <Ionicons name="layers-outline" size={22} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              background="blueMedium"
              style={{ borderRadius: 999 }}
              accessibilityLabel="Ayarlar"
            >
              <Ionicons name="settings-outline" size={22} color={colors.white} />
            </Pressable>
          </Stack>
        </Stack>

                {/* Başlık */}
        <Text variant="h1" color="white" style={{ marginTop: spacing.md , alignSelf: 'center', fontSize: 30}}>
          Hazırlama Kuyruğu
        </Text>

        {/* Gerçek durum dağılımı — üç kutu yan yana, sahte SLA/ortalama süre
            yerine elimizdeki gerçek status verisinden dürüst sayılar. */}
        <Stack direction="row" gap="sm" style={{ marginTop: spacing.md }}>
          <StatBox value={receivedCount} label="talep alındı" />
          <StatBox value={preparingCount} label="hazırlanıyor" />
          <StatBox value={queue.length} label="bekleyen" />
        </Stack>
      </Box>

      <FlatList
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
        renderItem={({ item }) => {
          const priority = getTempFakePriority(item.id);
          return (
            <Pressable
              onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
              background="surface"
              radius="md"
              style={{
                width: '100%',
                padding: spacing.md,
                alignItems: 'flex-start',
                borderLeftWidth: 4,
                borderLeftColor: colors[priorityColors[priority]],
              }}
            >
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                <PriorityBadge priority={priority} />
                <Text variant="caption" color="textMuted">
                  {getRelativeTime(item.createdAt)}
                </Text>
              </Stack>
              <Text variant="bodyBold" style={{ marginTop: spacing.sm }}>
                {products[item.productId]}
              </Text>
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%', marginTop: spacing.xs }}>
                <Text variant="caption" color="textMuted">
                  {item.quantity} adet
                </Text>
                <StatusChip status={item.status} />
              </Stack>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="Kuyruk boş" description="Şu an bekleyen talep yok" icon="checkmark-done-outline" />
        }
      />
    </Box>
  );
}


function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: colors.blueDark,
        borderRadius: radius.md,
        padding: spacing.sm,
        alignItems: 'center',
      }}
    >
      <Text variant="h2" color="white">
        {value}
      </Text>
      <Text variant="caption" color="white" style={{ opacity: 0.75 }}>
        {label}
      </Text>
    </Box>
  );
}