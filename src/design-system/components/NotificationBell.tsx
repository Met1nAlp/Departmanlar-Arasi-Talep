// src/design-system/components/NotificationBell.tsx
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Box } from '../primitives/Box';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { colors } from '../tokens';
import { scale } from '../tokens/scale';
import { observeUnreadCount } from '../../infrastructure/notifications/notificationService';

const SIZE = scale(38);

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
      style={{ borderRadius: 999, width: SIZE, height: SIZE, minWidth: SIZE, minHeight: SIZE }}
      accessibilityLabel="Bildirimler"
    >
      <Ionicons name="notifications-outline" size={scale(18)} color={colors.white} />
      {count > 0 && (
        <Box
          background="danger"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: scale(16),
            height: scale(16),
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
            borderWidth: 1.5,
            borderColor: colors.blue,
          }}
        >
          <Text variant="caption" color="white" style={{ fontSize: 9, fontWeight: '700' }}>
            {count > 9 ? '9+' : count}
          </Text>
        </Box>
      )}
    </Pressable>
  );
}