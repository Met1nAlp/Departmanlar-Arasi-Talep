import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from './src/infrastructure/db';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <RootNavigator />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
