// src/screens/saha-personeli/HomeScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SahaPersoneliStackParamList } from '../../navigation/types';
import { Request } from '../../types';
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
import { getProductsByIds } from '../../api/products';
import { useActiveUser } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { canCreateLegacyRequest } from '../../domain/request/legacyAdapter';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<SahaPersoneliStackParamList, 'Home'>;

type Filter = 'aktif' | 'tamamlanan' | 'tumu';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'tamamlanan', label: 'Tamamlanan' },
  { key: 'tumu', label: 'Tümü' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const pendingSyncCount = useConnectionStore((s) => s.pendingSyncCount);
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('aktif');

  const loadRequests = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    getRequests({ userId: user.id })
      .then(async (reqs) => {
        setRequests(reqs);
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

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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

  const activeCount = requests.filter((r) => r.status !== 'TESLIM_EDILDI').length;
  const visibleRequests = requests.filter((r) => {
    if (filter === 'aktif') return r.status !== 'TESLIM_EDILDI';
    if (filter === 'tamamlanan') return r.status === 'TESLIM_EDILDI';
    return true;
  });

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
                    <Pressable
            onPress={() => navigation.navigate('Settings')}
            background="blueMedium"
            style={{ borderRadius: 999 }}
            accessibilityLabel="Ayarlar"
          >
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </Pressable>
        </Stack>
        <Text variant="body" color="blueLight" style={{ marginTop: spacing.xs }}>
          {user?.name} · {activeCount} aktif talep
        </Text>

        <Stack
          direction="row"
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.blueDark,
            borderRadius: radius.lg,
            padding: spacing.xs,
          }}
        >
          {FILTERS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              background={filter === key ? 'white' : undefined}
              radius="lg"
              style={{ flex: 1, paddingVertical: spacing.xs }}
            >
              <Text variant="bodyBold" color={filter === key ? 'blue' : 'white'}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Stack>
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
              secondaryActionLabel="Geçmiş Talepleri Gör"
              onSecondaryAction={() => setFilter('tumu')}
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

      {/* RBAC: "Çağrı oluştur" yetkisi Plan Bölüm 6.3 tablosundan gelir
          (PLANNER hariç herkes) — karar RequestPolicies'te, ekranda değil. */}
      {user && canCreateLegacyRequest(user.role) && (
        <>
          {/* İkinci FAB: çok kalemli (çoklu ürün) talep akışı — birincinin üstünde duruyor */}
          <Pressable
            onPress={() => navigation.navigate('PartSearchForCart')}
            background="surface"
            radius="lg"
            style={{
              position: 'absolute',
              right: spacing.lg,
              bottom: spacing.lg + 64 + spacing.sm,
              width: 56,
              height: 56,
              borderWidth: 1,
              borderColor: colors.blue,
            }}
            accessibilityLabel="Çok kalemli talep oluştur"
          >
            <Ionicons name="cart-outline" size={24} color={colors.blue} />
          </Pressable>

          {/* Birincil FAB: tek ürün, QR tarayarak hızlı talep */}
          <Pressable
            testID="home-new-request-fab"
            onPress={() => navigation.navigate('DepartmentSelect')}
            background="blue"
            radius="lg"
            style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 64, height: 64 }}
            accessibilityLabel="Yeni talep oluştur"
          >
            <Text variant="h1" color="white">
              +
            </Text>
          </Pressable>
        </>
      )}
    </Box>
  );
}
