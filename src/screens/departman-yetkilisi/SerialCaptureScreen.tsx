import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { EmptyState } from '../../design-system/components/EmptyState';
import { spacing, colors, radius } from '../../design-system/tokens';
import { useSerialCaptureStore } from '../../store/serialCaptureStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'SerialCapture'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'SerialCapture'>;

// NOT: Kamera ile okuma (donanım tarayıcı/GS1 ayrıştırma) Efe'nin E6 maddesi
// (ScannerAdapter) gelince buraya bağlanacak. Şimdilik elle giriş — işlevsel,
// ama saha kullanımı için tarayıcı entegrasyonu zorunlu olacak. Aşağıdaki
// tarayıcı ikonu şimdilik görsel yer tutucu, henüz kamera açmıyor.
export default function SerialCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Rt>();
  const setSerials = useSerialCaptureStore((s) => s.setSerials);
  const existing = useSerialCaptureStore((s) => s.serialsByLine[route.params.lineId] ?? []);

  const [serials, setLocalSerials] = useState<string[]>(existing);
  const [input, setInput] = useState('');

  const targetQty = route.params.qty;
  const remaining = Math.max(0, targetQty - serials.length);
  const isComplete = serials.length >= targetQty;

  const handleAdd = () => {
    if (!input.trim() || serials.length >= targetQty) return;
    setLocalSerials((prev) => [...prev, input.trim()]);
    setInput('');
  };

  const handleRemove = (index: number) => {
    setLocalSerials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSerials(route.params.lineId, serials);
    navigation.goBack();
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
          <Box>
            {(route.params.requestNo || route.params.productName) && (
              <Text variant="caption" color="white" style={{ opacity: 0.75, letterSpacing: 1 }}>
                {[route.params.requestNo, route.params.productName].filter(Boolean).join(' · ').toUpperCase()}
              </Text>
            )}
            <Text variant="h1" color="white">
              Seri No Girişi
            </Text>
          </Box>
        </Stack>

        <Stack direction="row" justify="space-between" align="center" style={{ marginTop: spacing.md }}>
          <Text variant="bodyBold" color="white">
            {serials.length}/{targetQty} seri no girildi
          </Text>
          {remaining > 0 && (
            <Text variant="body" color="white" style={{ opacity: 0.85 }}>
              {remaining} kaldı
            </Text>
          )}
        </Stack>
        <Box
          background="blueMedium"
          radius="sm"
          style={{ height: 6, marginTop: spacing.sm, overflow: 'hidden' }}
        >
          <Box
            background="white"
            radius="sm"
            style={{ height: '100%', width: `${Math.min(100, (serials.length / targetQty) * 100)}%` }}
          />
        </Box>
      </Box>

      <Box padding="md" style={{ flex: 1 }}>
        <Box background="surface" radius="md" padding="md">
          <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginBottom: spacing.sm }}>
            SERİ NO OKUT VEYA GİR
          </Text>
          <Stack direction="row" gap="sm">
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="SN-0000-0000"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleAdd}
                editable={!isComplete}
                autoCapitalize="characters"
              />
            </View>
            <Pressable background="blueLight" radius="md" style={{ width: 64 }} accessibilityLabel="Barkod okut (yakında)">
              <Ionicons name="scan-outline" size={22} color={colors.blue} />
            </Pressable>
          </Stack>
          <Box style={{ marginTop: spacing.sm }}>
            <Button
              label="Listeye Ekle"
              onPress={handleAdd}
              disabled={isComplete || !input.trim()}
            />
          </Box>
        </Box>

        <Text variant="caption" color="textMuted" style={{ letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          GİRİLENLER
        </Text>
        <FlatList
          data={serials}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item, index }) => (
            <Box background="surface" radius="md" style={{ marginBottom: spacing.xs }}>
              <Stack direction="row" justify="space-between" align="center" style={{ padding: spacing.md }}>
                <Stack direction="row" align="center" gap="sm">
                  <Box
                    background="blue"
                    style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </Box>
                  <Text variant="bodyBold">{item}</Text>
                </Stack>
                <Pressable
                  onPress={() => handleRemove(index)}
                  background="dangerLight"
                  style={{ borderRadius: 999 }}
                  accessibilityLabel="Kaldır"
                >
                  <Ionicons name="close" size={16} color={colors.danger} />
                </Pressable>
              </Stack>
            </Box>
          )}
          ListEmptyComponent={<EmptyState title="Henüz seri no girilmedi" icon="barcode-outline" />}
        />
      </Box>

      <Box padding="md" style={{ paddingTop: 0 }}>
        <Button
          label={isComplete ? 'Tamamla' : `Tamamla · ${remaining} seri no eksik`}
          onPress={handleSave}
          disabled={!isComplete}
        />
      </Box>
    </Box>
  );
}
