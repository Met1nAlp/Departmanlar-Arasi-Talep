import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from './src/infrastructure/db';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <RootNavigator />
    </DatabaseProvider>
  );
}
