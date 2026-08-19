import { useEffect } from 'react';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from './src/infrastructure/db';
import RootNavigator from './src/navigation/RootNavigator';
import { initDeviceId } from './src/infrastructure/security/deviceId';

export default function App() {
  useEffect(() => {
    // Cihaz UUID'sini SecureStore'dan oku ya da üret.
    // Bu ID backend'de "mac_address" alanı olarak kullanılır.
    void initDeviceId();
  }, []);

  return (
    <DatabaseProvider database={database}>
      <RootNavigator />
    </DatabaseProvider>
  );
}
