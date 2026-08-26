// src/screens/dev/ComponentGalleryScreen.tsx
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text } from '../../design-system/primitives/Text';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import {
  Button,
  StatusChip,
  EmptyState,
  ConnectionBanner,
  PriorityBadge,
  SlaTimer,
  RequestStatusStrip,
  LoadingView,
  ErrorView,
} from '../../design-system/components';
import { spacing } from '../../design-system/tokens';
import { errorFeedback, successFeedback } from '../../design-system/feedback';




// Storybook'un basit bir alternatifi — her bileşeni sahte veriyle, izole
// gösteren tek bir ekran. Geliştirme sırasında bileşenleri gerçek ekrana
// bağlamadan görsel olarak doğrulamak için kullanılır (PDF M2 kuralı).
// Navigasyona kalıcı eklenmez, sadece geliştirme sırasında geçici olarak açılır.
export default function ComponentGalleryScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Section title="Button">
        <Stack gap="sm">
          <Button label="Birincil" onPress={() => {}} />
          <Button label="İkincil" onPress={() => {}} variant="secondary" />
          <Button label="Tehlikeli" onPress={() => {}} variant="danger" />
          <Button label="Yükleniyor" onPress={() => {}} loading />
          <Button label="Devre Dışı" onPress={() => {}} disabled />
          <Button label="Titreşim Testi (Başarı)" onPress={successFeedback} variant="secondary" />
          <Button label="Titreşim Testi (Hata)" onPress={errorFeedback} variant="danger" />
        </Stack>
      </Section>

      <Section title="StatusChip (tüm durumlar)">
        <Stack direction="row" gap="sm" wrap>
          <StatusChip status="TALEP_ALINDI" />
          <StatusChip status="HAZIRLANIYOR" />
          <StatusChip status="HAZIR" />
          <StatusChip status="YOLDA" />
          <StatusChip status="TESLIM_EDILDI" />
        </Stack>
      </Section>

      <Section title="RequestStatusStrip">
        <RequestStatusStrip currentStatus="HAZIR" />
      </Section>

      <Section title="PriorityBadge">
        <Stack direction="row" gap="sm" wrap>
          <PriorityBadge priority="ACIL" />
          <PriorityBadge priority="NORMAL" />
        </Stack>
      </Section>

      <Section title="SlaTimer">
        <Stack direction="row" gap="lg">
          <SlaTimer dueAt={new Date(Date.now() + 5 * 60000).toISOString()} />
          <SlaTimer dueAt={new Date(Date.now() - 2 * 60000).toISOString()} />
        </Stack>
      </Section>

      <Section title="ConnectionBanner">
        <Stack gap="xs">
          <ConnectionBanner status="connecting" />
          <ConnectionBanner status="disconnected" />
        </Stack>
      </Section>

      <Section title="EmptyState">
        <Box style={{ height: 220 }}>
          <EmptyState title="Kayıt yok" description="Örnek açıklama metni" icon="cube-outline" />
        </Box>
      </Section>

      <Section title="ErrorView">
        <Box style={{ height: 220 }}>
          <ErrorView message="Örnek hata mesajı" onRetry={() => {}} />
        </Box>
      </Section>

      <Section title="LoadingView">
        <Box style={{ height: 120 }}>
          <LoadingView />
        </Box>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text variant="h2" style={{ marginBottom: spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});