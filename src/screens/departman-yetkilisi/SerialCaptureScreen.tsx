import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DepartmanYetkilisiStackParamList } from '../../navigation/types';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { Button } from '../../design-system/components/Button';
import { TextField } from '../../design-system/components/TextField';
import { EmptyState } from '../../design-system/components/EmptyState';
import { spacing, colors } from '../../design-system/tokens';
import { useSerialCaptureStore } from '../../store/serialCaptureStore';

type Nav = NativeStackNavigationProp<DepartmanYetkilisiStackParamList, 'SerialCapture'>;
type Rt = RouteProp<DepartmanYetkilisiStackParamList, 'SerialCapture'>;

// NOT: Kamera ile okuma (donanım tarayıcı/GS1 ayrıştırma) Efe'nin E6 maddesi
// (ScannerAdapter) gelince buraya bağlanacak. Şimdilik elle giriş — işlevsel,
// ama saha kullanımı için tarayıcı entegrasyonu zorunlu olacak.
export default function SerialCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const setSerials = useSerialCaptureStore((s) => s.setSerials);
  const existing = useSerialCaptureStore((s) => s.serialsByLine[route.params.lineId] ?? []);

  const [serials, setLocalSerials] = useState<string[]>(existing);
  const [input, setInput] = useState('');

  const targetQty = route.params.qty;
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
    <Box style={{ flex: 1 }} background="white" padding="md">
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
        {serials.length} / {targetQty} seri no girildi
      </Text>

      <Stack direction="row" gap="sm" style={{ marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="Seri numarası"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            editable={!isComplete}
          />
        </View>
        <Button label="Ekle" onPress={handleAdd} fullWidth={false} disabled={isComplete || !input.trim()} />
      </Stack>

      <FlatList
        data={serials}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <Stack
            direction="row"
            justify="space-between"
            align="center"
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: 8,
              marginBottom: spacing.xs,
            }}
          >
            <Text variant="body">{item}</Text>
            <Pressable onPress={() => handleRemove(index)} style={{ minWidth: 32, minHeight: 32 }}>
              <Text variant="body" color="danger">
                ✕
              </Text>
            </Pressable>
          </Stack>
        )}
        ListEmptyComponent={<EmptyState title="Henüz seri no girilmedi" icon="barcode-outline" />}
      />

      <Box style={{ marginTop: spacing.md }}>
        <Button label="Kaydet" onPress={handleSave} disabled={!isComplete} />
      </Box>
    </Box>
  );
}