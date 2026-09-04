// src/__mocks__/react-native.ts
//
// Jest testEnvironment 'node' — gerçek react-native paketi (Flow/JSX kaynaklı)
// bu ortamda import edilemiyor ("Cannot use import statement outside a
// module"). Testlerimiz sadece saf domain/infrastructure birimlerini
// hedeflediği için (bkz. jest.config.js dosya başı notu) react-native'den
// gerçekte sadece design-system/tokens/scale.ts'in kullandığı Dimensions.get
// gerekiyor — o yüzden paketin tamamı yerine bu minimal sahte sürüm kullanılır.

export const Dimensions = {
  get: () => ({ width: 360, height: 800 }),
};
