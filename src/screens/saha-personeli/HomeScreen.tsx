// src/screens/saha-personeli/HomeScreen.tsx
import { useCallback, useState } from 'react';
import { FlatList, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request, Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ErrorView } from '../../design-system/components/ErrorView';
import { colors, spacing, radius } from '../../design-system/tokens';
import RequestCard from '../../components/RequestCard';
import { getRequests } from '../../api/requests';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { canCreateLegacyRequest } from '../../domain/request/legacyAdapter';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBell } from '../../design-system/components/NotificationBell';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'Home'>;

type Filter = 'aktif' | 'kismi' | 'tamamlanan';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'kismi', label: 'Kısmi' },
  { key: 'tamamlanan', label: 'Tamamlanan' },
];

// Departman adının ilk kelimesini çip etiketi olarak kullanır — "Elektronik
// Üretim" -> "Elektronik" gibi, çipler dar kalsın diye.
function shortDeptLabel(name: string): string {
  return name.split(' ')[0];
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const pendingSyncCount = useConnectionStore((s) => s.pendingSyncCount);
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('aktif');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    Promise.all([getRequests({ userId: user.id }), getDepartments()])
      .then(async ([reqs, deps]) => {
        setRequests(reqs);
        setDepartments(deps);
        const productList = await getProductsByIds(reqs.map((r) => r.productId));
        const nameMap = Object.fromEntries(productList.map((p) => [p.id, p.name]));
        setProducts(nameMap);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadError(true);
      });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  // Sunucudan gelen REQUEST_STATUS_UPDATED broadcast'i anlık günceller —
  // kullanıcı ekranı yeniden açmasa bile durum değişikliği hemen görünür.
  useRequestUpdates((updated) => {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (exists) {
        return prev.map((r) => (r.id === updated.id ? updated : r));
      }
      // Bu kullanıcıya ait yeni bir talep mi, kontrol et (başka kullanıcının
      // talebi gelmişse eklemeyelim).
      return updated.requesterId === user?.id ? [...prev, updated] : prev;
    });
  });

  if (loading) return <LoadingView />;

  if (loadError) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <ErrorView
          icon="cloud-offline-outline"
          title="Talepler yüklenemedi"
          message="Bağlantı geldiğinde otomatik olarak gönderilecek — veri kaybı olmaz."
          onRetry={loadRequests}
          secondaryLabel="Çevrimdışı Devam Et"
          onSecondary={() => setLoadError(false)}
          extra={
            pendingSyncCount > 0 ? (
              <Box padding="md" background="surface" radius="md">
                <Stack direction="row" justify="space-between" align="center">
                  <Text variant="body" color="textSecondary">
                    Kuyrukta bekleyen
                  </Text>
                  <Stack direction="row" align="center" gap="xs">
                    <Ionicons name="time-outline" size={16} color={colors.warning} />
                    <Text variant="bodyBold" color="textSecondary">
                      {pendingSyncCount} talep
                    </Text>
                  </Stack>
                </Stack>
              </Box>
            ) : undefined
          }
        />
      </Box>
    );
  }

  const isTerminal = (r: Request) => r.status === 'IPTAL_EDILDI' || r.status === 'REDDEDILDI';
  const nonCancelled = requests.filter((r) => !isTerminal(r));
  const activeCount = nonCancelled.filter((r) => r.status !== 'TESLIM_EDILDI').length;
  const isPartial = (r: Request) =>
    r.fulfilledQuantity !== undefined &&
    r.fulfilledQuantity < r.quantity &&
    (r.status === 'HAZIRLANIYOR' || r.status === 'HAZIR');

  const visibleRequests = nonCancelled.filter((r) => {
    if (filter === 'kismi') return isPartial(r);
    if (filter === 'aktif') return r.status !== 'TESLIM_EDILDI' && !isPartial(r);
    return r.status === 'TESLIM_EDILDI';
  })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        <Stack direction="row" justify="space-between" align="center">
          <Text variant="h1" color="white">
            Taleplerim
          </Text>
          <Stack direction="row" gap="sm">
            <NotificationBell />
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
        <Text variant="body" color="blueLight" style={{ marginTop: spacing.xs }}>
          {user?.name} · {activeCount} aktif talep
        </Text>

        {/* Aktif/Tamamlanan sekmesi — küçültülmüş, sadece 2 seçenek */}
        <Stack
          direction="row"
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.blueDark,
            borderRadius: radius.lg,
            padding: 3,
          }}
        >
          {FILTERS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              background={filter === key ? 'white' : undefined}
              radius="lg"
              style={{ flex: 1, paddingVertical: 6, minHeight: undefined }}
            >
              <Text variant="caption" color={filter === key ? 'blue' : 'white'} style={{ fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Stack>

        {/* Departman filtre çipleri — dinamik, ekrana göre kaydırılabilir, küçük */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, marginTop: spacing.sm }}
        >
          <Pressable
            onPress={() => setDeptFilter(null)}
            background={deptFilter === null ? 'white' : 'blueMedium'}
            radius="lg"
            style={{ paddingHorizontal: spacing.sm, paddingVertical: 5, minHeight: undefined, minWidth: undefined }}
          >
            <Text variant="caption" color={deptFilter === null ? 'blue' : 'white'} style={{ fontWeight: '600' }}>
              Tümü
            </Text>
          </Pressable>
          {departments.map((dep) => {
            const isSelected = deptFilter === dep.id;
            return (
              <Pressable
                key={dep.id}
                onPress={() => setDeptFilter(dep.id)}
                background={isSelected ? 'white' : 'blueMedium'}
                radius="lg"
                style={{ paddingHorizontal: spacing.sm, paddingVertical: 5, minHeight: undefined, minWidth: undefined }}
              >
                <Text variant="caption" color={isSelected ? 'blue' : 'white'} style={{ fontWeight: '600' }}>
                  {shortDeptLabel(dep.name)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      <FlatList
        data={visibleRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        ItemSeparatorComponent={() => <Box style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            productName={products[item.productId]}
            departmentName={departments.find((d) => d.id === item.departmentId)?.name}
            onPress={() => navigation.navigate('RequestTracking', { requestId: item.id })}
          />
        )}
        ListEmptyComponent={
          filter === 'aktif' ? (
            <EmptyState
              icon="grid-outline"
              title="Aktif talebiniz yok"
              description="Parça etiketini okutarak saniyeler içinde yeni bir malzeme talebi oluşturabilirsiniz."
              actionLabel="Yeni Talep Oluştur"
              actionVariant="primary"
              onAction={() => navigation.navigate('DepartmentSelect')}
            />
          ) : (
            <EmptyState
              icon="file-tray-outline"
              title="Talep bulunamadı"
              description="Bu sekmede gösterilecek bir talebiniz yok."
            />
          )
        }
      />

      {user && canCreateLegacyRequest(user.role) && (
        <Pressable
          testID="home-new-request-fab"
          onPress={() => navigation.navigate('DepartmentSelect')}
          background="blue"
          radius="lg"
          style={{ position: 'absolute', right: spacing.lg, bottom: insets.bottom + spacing.lg, width: 64, height: 64 }}
          accessibilityLabel="Yeni talep oluştur"
        >
          <Text variant="h1" color="white">
            +
          </Text>
        </Pressable>
      )}
    </Box>
  );
}