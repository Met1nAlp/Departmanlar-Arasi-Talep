// src/screens/uretim-yoneticisi/HomeScreen.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  RefreshControl,
  Pressable as RNPressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Request, Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Text } from '../../design-system/primitives/Text';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ErrorView } from '../../design-system/components/ErrorView';
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import RequestCard from '../../components/RequestCard';
import { RequestOrderGroupCard } from '../../design-system/components/RequestOrderGroupCard';
import { groupRequestsByOrder } from '../../domain/request/groupByOrder';
import { getRequests } from '../../api/requests';
import { useRequestUpdates } from '../../hooks/useRequestUpdates';
import { getProductsByIds } from '../../api/products';
import { getDepartments } from '../../api/departments';
import { useActiveUser } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useCartStore } from '../../store/cartStore';
import { canCreateLegacyRequest } from '../../domain/request/legacyAdapter';
import { NotificationBell } from '../../design-system/components/NotificationBell';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'Home'>;

type Filter = 'aktif' | 'tamamlanan';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'tamamlanan', label: 'Tamamlanan' },
];

const FAB_HEIGHT = scale(52);

// Senkron şeridi için amber tonları. Kalıcı olarak kullanılacaklarından
// tokens/colors içine `warningSurface` / `warningText` olarak taşınmalı.
const SYNC_BANNER_BG = 'rgba(239, 159, 39, 0.14)';
const SYNC_BANNER_TEXT = '#633806';

const isTerminal = (r: Request) => r.status === 'IPTAL_EDILDI' || r.status === 'REDDEDILDI';

const isPartial = (r: Request) =>
  r.fulfilledQuantity !== undefined &&
  r.fulfilledQuantity > 0 &&
  r.fulfilledQuantity < r.quantity &&
  (r.status === 'HAZIRLANIYOR' || r.status === 'HAZIR');

// Liste "en yeni" değil "eyleme geçebileceğim" sırasına göre diziliyor.
// Hazır olan talep gidip alınacak olandır; listenin en üstünde durmalı.
const STATUS_WEIGHT: Record<string, number> = {
  HAZIR: 0,
  HAZIRLANIYOR: 20,
  ONAY_BEKLIYOR: 30,
  BEKLEMEDE: 30,
};

function sortWeight(r: Request): number {
  if (r.status === 'HAZIR') return 0;
  if (isPartial(r)) return 10;
  return STATUS_WEIGHT[r.status] ?? 40;
}

function SkeletonCard({ opacity }: { opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.View style={{ opacity }}>
      <Box background="surface" radius="md" padding="md" style={{ height: scale(92) }}>
        <Box
          style={{
            width: '55%',
            height: scale(14),
            borderRadius: radius.sm,
            backgroundColor: colors.border,
          }}
        />
        <Box
          style={{
            width: '35%',
            height: scale(11),
            borderRadius: radius.sm,
            backgroundColor: colors.border,
            marginTop: spacing.sm,
            opacity: 0.7,
          }}
        />
      </Box>
    </Animated.View>
  );
}

function SkeletonList() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <Stack gap="sm" style={{ padding: spacing.md }}>
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
    </Stack>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const pendingSyncCount = useConnectionStore((s) => s.pendingSyncCount);
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('aktif');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasLoadedOnce = useRef(false);

  const loadRequests = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      if (!user) return;
      if (mode === 'initial') setInitialLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setLoadError(false);
      try {
        const [reqs, deps] = await Promise.all([getRequests({ userId: user.id }), getDepartments()]);
        setRequests(reqs);
        setDepartments(deps);
        const productList = await getProductsByIds(reqs.map((r) => r.productId));
        setProducts(Object.fromEntries(productList.map((p) => [p.id, p.name])));
        hasLoadedOnce.current = true;
      } catch {
        // Elimizde veri varsa ekranı boşaltmıyoruz — sessiz yenileme başarısız
        // olduğunda kullanıcı eski listeyle çalışmaya devam edebilir.
        if (!hasLoadedOnce.current) setLoadError(true);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      // İlk açılış iskelet gösterir; sonraki odaklanmalar ekranı yanıp
      // söndürmeden arka planda tazeler.
      loadRequests(hasLoadedOnce.current ? 'silent' : 'initial');
    }, [loadRequests])
  );

  useRequestUpdates((updated) => {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (exists) {
        return prev.map((r) => (r.id === updated.id ? updated : r));
      }
      return updated.requesterId === user?.id ? [...prev, updated] : prev;
    });
  });

  const handleNewRequest = () => {
    useCartStore.getState().clear();
    navigation.navigate('DepartmentSelect');
  };

  if (loadError) {
    return (
      <Box style={{ flex: 1 }} background="white">
        <ErrorView
          icon="cloud-offline-outline"
          title="Talepler yüklenemedi"
          message="Bağlantı geldiğinde otomatik olarak gönderilecek — veri kaybı olmaz."
          onRetry={() => loadRequests('initial')}
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

  const scoped = requests.filter(
    (r) => !isTerminal(r) && (!deptFilter || r.departmentId === deptFilter)
  );
  const activeCount = scoped.filter((r) => r.status !== 'TESLIM_EDILDI').length;
  const doneCount = scoped.length - activeCount;

  const visibleRequests = scoped
    .filter((r) => (filter === 'aktif' ? r.status !== 'TESLIM_EDILDI' : r.status === 'TESLIM_EDILDI'))
    .sort((a, b) => {
      if (filter === 'tamamlanan') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const weightDiff = sortWeight(a) - sortWeight(b);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Aynı sepetten (orderId) gelen talepler listede ayrı ayrı kart olarak
  // değil, tek bir sipariş kartı altında gruplanır — bkz. groupByOrder.ts.
  const orderGroups = groupRequestsByOrder(visibleRequests);

  const activeDept = departments.find((d) => d.id === deptFilter);
  const listBottomPadding = insets.bottom + spacing.lg + FAB_HEIGHT + spacing.md;

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
          <Box style={{ flexShrink: 1 }}>
            <Text variant="h1" color="white">
              Taleplerim
            </Text>
            <Text variant="caption" color="blueLight" style={{ marginTop: 2 }}>
              {user?.name} · {activeCount} aktif
            </Text>
          </Box>
          <Stack direction="row" gap="sm">
            <NotificationBell />
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              background="blueMedium"
              style={{ borderRadius: 999, width: scale(38), height: scale(38), minWidth: scale(38), minHeight: scale(38) }}
              accessibilityLabel="Ayarlar"
            >
              <Ionicons name="settings-outline" size={scale(18)} color={colors.white} />
            </Pressable>
          </Stack>
        </Stack>

        <Stack direction="row" gap="sm" align="center" style={{ marginTop: spacing.sm }}>
          <Stack
            direction="row"
            style={{
              flex: 1,
              backgroundColor: colors.blueDark,
              borderRadius: radius.lg,
              padding: 3,
            }}
          >
            {FILTERS.map(({ key, label }) => {
              const selected = filter === key;
              const count = key === 'aktif' ? activeCount : doneCount;
              return (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  background={selected ? 'white' : undefined}
                  radius="lg"
                  style={{ flex: 1, paddingVertical: spacing.sm }}
                  accessibilityLabel={`${label} talepler, ${count} adet`}
                >
                  <Text
                    variant="body"
                    color={selected ? 'blue' : 'white'}
                    style={{ fontWeight: '600', fontSize: scale(15) }}
                  >
                    {label}
                    {count > 0 ? ` · ${count}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </Stack>

          <Pressable
            onPress={() => setSheetOpen(true)}
            radius="lg"
            style={{
              width: scale(48),
              height: scale(48),
              backgroundColor: deptFilter ? colors.white : 'rgba(255,255,255,0.16)',
            }}
            accessibilityLabel={
              activeDept ? `Departman filtresi: ${activeDept.name}` : 'Departmana göre filtrele'
            }
          >
            <Ionicons
              name="filter"
              size={20}
              color={deptFilter ? colors.blue : colors.white}
            />
          </Pressable>
        </Stack>

        {activeDept && (
          <Stack direction="row" align="center" gap="xs" style={{ marginTop: spacing.xs }}>
            <Text variant="caption" color="blueLight">
              {activeDept.name}
            </Text>
            <Pressable
              onPress={() => setDeptFilter(null)}
              style={{ paddingHorizontal: 4, minHeight: undefined }}
              accessibilityLabel="Departman filtresini kaldır"
            >
              <Ionicons name="close-circle" size={16} color={colors.blueLight} />
            </Pressable>
          </Stack>
        )}
      </Box>

      {pendingSyncCount > 0 && (
        <Stack
          direction="row"
          align="center"
          gap="xs"
          style={{
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: SYNC_BANNER_BG,
          }}
        >
          <Ionicons name="cloud-upload-outline" size={17} color={SYNC_BANNER_TEXT} />
          <Text variant="caption" style={{ color: SYNC_BANNER_TEXT, flexShrink: 1 }}>
            {pendingSyncCount} talep kuyrukta · bağlantı gelince gönderilecek
          </Text>
        </Stack>
      )}

      {initialLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={orderGroups}
          keyExtractor={(group) => group.key}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: listBottomPadding,
            flexGrow: 1,
          }}
          ItemSeparatorComponent={() => <Box style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRequests('refresh')}
              tintColor={colors.blue}
              colors={[colors.blue]}
            />
          }
          renderItem={({ item: group }) => {
            const firstRequest = group.requests[0];
            const totalQty = group.requests.reduce((sum, r) => sum + r.quantity, 0);
            // Departman katalogu backend'de henüz yok (mock), bu yüzden
            // eşleşmezse sunucudan gelen ham departmentId'yi gösteriyoruz —
            // boş bırakmaktansa "bir şey" göstermek daha iyi.
            const departmentName =
              departments.find((d) => d.id === firstRequest.departmentId)?.name || firstRequest.departmentId;
            return (
              <RequestOrderGroupCard
                group={group}
                title={departmentName || 'Sipariş'}
                subtitle={`${group.requests.length} kalem · ${totalQty} adet`}
                renderItem={(request) => (
                  <RequestCard
                    request={request}
                    productName={products[request.productId]}
                    meta={departments.find((d) => d.id === request.departmentId)?.name || request.departmentId}
                    onPress={() => navigation.navigate('RequestTracking', { requestId: request.id })}
                  />
                )}
              />
            );
          }}
          ListEmptyComponent={
            filter === 'aktif' ? (
              <EmptyState
                icon="grid-outline"
                title="Aktif talebiniz yok"
                description="Parça etiketini okutarak saniyeler içinde yeni bir malzeme talebi oluşturabilirsiniz."
                actionLabel="Yeni talep oluştur"
                actionVariant="primary"
                onAction={handleNewRequest}
              />
            ) : (
              <EmptyState
                icon="file-tray-outline"
                title="Teslim edilmiş talep yok"
                description={
                  activeDept
                    ? `${activeDept.name} için tamamlanmış bir talebiniz bulunmuyor.`
                    : 'Tamamlanan talepleriniz burada listelenir.'
                }
              />
            )
          }
        />
      )}

      {user && canCreateLegacyRequest(user.role) && (
        <Pressable
          testID="home-new-request-fab"
          onPress={handleNewRequest}
          background="blue"
          radius="lg"
          style={{
            position: 'absolute',
            right: spacing.lg,
            bottom: insets.bottom + spacing.lg,
            height: FAB_HEIGHT,
            paddingHorizontal: spacing.lg,
            borderRadius: 999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
          }}
          accessibilityLabel="Yeni talep oluştur"
        >
          <Stack direction="row" align="center" gap="xs">
            <Ionicons name="qr-code-outline" size={scale(20)} color={colors.white} />
            <Text variant="body" color="white" style={{ fontWeight: '600' }}>
              Yeni talep
            </Text>
          </Stack>
        </Pressable>
      )}

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <RNPressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setSheetOpen(false)}
          accessibilityLabel="Kapat"
        />
        <Box
          background="white"
          style={{
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingBottom: insets.bottom + spacing.md,
            maxHeight: '70%',
          }}
        >
          <Box style={{ padding: spacing.md }}>
            <Text variant="h1" style={{ fontSize: scale(18) }}>
              Departman
            </Text>
          </Box>
          <ScrollView>
            {[{ id: null, name: 'Tüm departmanlar' }, ...departments].map((dep) => {
              const selected = deptFilter === dep.id;
              return (
                <Pressable
                  key={dep.id ?? 'all'}
                  onPress={() => {
                    setDeptFilter(dep.id);
                    setSheetOpen(false);
                  }}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    alignItems: 'stretch',
                  }}
                  accessibilityLabel={dep.name}
                >
                  <Stack direction="row" justify="space-between" align="center">
                    <Text variant="body" color={selected ? 'blue' : undefined}>
                      {dep.name}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color={colors.blue} />}
                  </Stack>
                </Pressable>
              );
            })}
          </ScrollView>
        </Box>
      </Modal>
    </Box>
  );
}