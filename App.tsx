import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from './src/infrastructure/db';
import RootNavigator from './src/navigation/RootNavigator';

// Native splash'i, RootNavigator veritabanı/katalog senkronunu bitirip
// "hazırım" diyene kadar açık tutuyoruz — otomatik kapanmasın.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <RootNavigator />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}