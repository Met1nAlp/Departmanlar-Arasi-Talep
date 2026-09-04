// src/screens/uretim-yoneticisi/DepartmentSelectScreen.tsx
//
// GERİ GETİRİLDİ (2026-09-06): "Ürün önce seçilir, departman ürünün kendi
// departmentId'sinden gelir" modeline geçmiştik ama PROCESS_QR (QR okutma)
// departman bilgisini vermiyor (doğrulandı — bkz. api/products.ts dosya başı
// notu) — bu yüzden departman ataması güvenilmezdi. Artık kullanıcı YENİ
// TALEP akışına girerken önce departmanı kendisi seçiyor; QRScanScreen bu
// departmanı hem talebin gideceği yer olarak kullanıyor hem de yalnızca o
// departmana ait ürünlerin taranmasına izin veriyor (kısıtlayıcı mod).
//
// NOT: Departman listesi hâlâ backend'de yok (GET_DEPARTMENTS diye bir komut
// yok) — getDepartments() üç sabit mock departman döndürüyor (bkz.
// mocks/catalog.ts). Barış gerçek komutu ekleyince burada değişiklik gerekmez.

import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { UretimYoneticisiStackParamList } from '../../navigation/types';
import { Department } from '../../types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { LoadingView } from '../../design-system/components/LoadingView';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing, radius } from '../../design-system/tokens';
import { scale } from '../../design-system/tokens/scale';
import { getDepartments } from '../../api/departments';

type Nav = NativeStackNavigationProp<UretimYoneticisiStackParamList, 'DepartmentSelect'>;

export default function DepartmentSelectScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState<Department[] | null>(null);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  const handleSelect = (department: Department) => {
    navigation.navigate('QRScan', { departmentId: department.id, departmentName: department.name });
  };

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
        <Stack direction="row" align="center" gap="md">
          <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Box style={{ flex: 1 }}>
            <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
              YENİ TALEP
            </Text>
            <Text variant="h2" color="white">
              Departman Seçin
            </Text>
          </Box>
        </Stack>
      </Box>

      {departments === null ? (
        <LoadingView />
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              background="surface"
              radius="md"
              style={{ width: '100%', padding: spacing.md, justifyContent: 'flex-start' }}
            >
              <Stack direction="row" align="center" gap="md" style={{ width: '100%' }}>
                <Box
                  background="blueLight"
                  radius="md"
                  style={{ width: scale(44), height: scale(44), alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="business-outline" size={scale(22)} color={colors.blue} />
                </Box>
                <Text variant="bodyBold" style={{ flex: 1 }}>
                  {item.name}
                </Text>
                <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
              </Stack>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState title="Departman bulunamadı" icon="business-outline" />
          }
        />
      )}
    </Box>
  );
}
