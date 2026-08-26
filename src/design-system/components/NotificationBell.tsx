// src/design-system/components/NotificationBell.tsx
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Box } from '../primitives/Box';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors } from '../tokens';
import { observeUnreadCount } from '../../infrastructure/notifications/notificationService';

export function NotificationBell() {
  const navigation = useNavigation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = observeUnreadCount(setCount);
    return unsubscribe;
  }, []);

  return (
    <Pressable
      onPress={() => (navigation as any).navigate('Notifications')}
      background="blueMedium"
      style={{ borderRadius: 999 }}
      accessibilityLabel="Bildirimler"
    >
      <Ionicons name="notifications-outline" size={22} color={colors.white} />
      {count > 0 && (
        <Box
          background="danger"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text variant="caption" color="white" style={{ fontSize: 10, fontWeight: '700' }}>
            {count > 9 ? '9+' : count}
          </Text>
        </Box>
      )}
    </Pressable>
  );
}