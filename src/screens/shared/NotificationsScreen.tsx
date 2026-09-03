// src/screens/shared/NotificationsScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../design-system/primitives/Box';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Pressable } from '../../design-system/primitives/Pressable';
import { EmptyState } from '../../design-system/components/EmptyState';
import { colors, spacing, radius } from '../../design-system/tokens';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../infrastructure/db';
import NotificationRecord from '../../infrastructure/db/models/Notification';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../infrastructure/notifications/notificationService';
import { getRequestById } from '../../api/requests';
import { useAuthStore } from '../../store/authStore';
import { useCallback } from 'react';

function getRelativeTime(ms: number): string {
  const diffMin = Math.floor((Date.now() - ms) / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} sa önce`;
  return `${Math.floor(diffMin / 1440)} gün önce`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.currentUser);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    const collection = database.get<NotificationRecord>('notifications');
    collection
      .query(Q.where('user_id', user.id))
      .fetch()
      .then((rows) => {
        setItems([...rows].sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePress = async (item: NotificationRecord) => {
    await markNotificationAsRead(item.id);
    load();
    if (!user) return;

    // Bildirim eski olabilir — talep o aralar webden silinmiş olabilir.
    // Var olmayan bir talebin detayına gitmeye çalışmak yerine, önce hâlâ
    // var mı diye bakıyoruz (aksi halde detay ekranı sonsuza kadar
    // yükleniyor kalırdı).
    const request = await getRequestById(item.requestId);
    if (!request) {
      Alert.alert('Talep bulunamadı', 'Bu talep artık mevcut değil — silinmiş olabilir.');
      return;
    }

    if (user.role === 'departman_yetkilisi') {
      (navigation as any).navigate('RequestDetail', { requestId: item.requestId });
    } else if (user.role === 'uretim_yoneticisi') {
      (navigation as any).navigate('RequestTracking', { requestId: item.requestId });
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    load();
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
        <Stack direction="row" align="center" justify="space-between">
          <Stack direction="row" align="center" gap="md">
            <Pressable onPress={() => navigation.goBack()} background="blueMedium" radius="md" accessibilityLabel="Geri">
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>
            <Text variant="h2" color="white">
              Bildirimler
            </Text>
          </Stack>
          <Pressable
            onPress={() => Linking.openSettings()}
            background="blueMedium"
            radius="md"
            accessibilityLabel="Bildirim ayarlarını aç"
          >
            <Ionicons name="settings-outline" size={20} color={colors.white} />
          </Pressable>
        </Stack>
      </Box>

      {!loading && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, flexGrow: 1, gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePress(item)}
              background={item.isRead ? 'surface' : 'blueLight'}
              radius="md"
              style={{ width: '100%', padding: spacing.md, alignItems: 'flex-start' }}
            >
              <Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </Text>
                {!item.isRead && (
                  <Box style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.blue, marginLeft: spacing.sm }} />
                )}
              </Stack>
              <Text variant="body" color="textSecondary" style={{ marginTop: 2 }}>
                {item.body}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
                {getRelativeTime(item.createdAt)}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState title="Bildirim yok" description="Henüz hiç bildiriminiz yok" icon="notifications-outline" />
          }
        />
      )}

      {items.some((i) => !i.isRead) && (
        <Pressable
          onPress={handleMarkAllRead}
          background="blue"
          style={{
            position: 'absolute',
            bottom: insets.bottom + spacing.lg,
            right: spacing.lg,
            width: 56,
            height: 56,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
          }}
          accessibilityLabel="Tümünü okundu işaretle"
        >
          <Ionicons name="checkmark-done" size={24} color={colors.white} />
        </Pressable>
      )}
    </Box>
  );
}