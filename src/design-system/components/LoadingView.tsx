// src/design-system/components/LoadingView.tsx
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../tokens';

// 5 ekranda kopyalanmış "flex:1, justifyContent:center, ActivityIndicator" bloğunun
// yerini alır. Tüm yükleme durumları buradan geçmeli.
export function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});