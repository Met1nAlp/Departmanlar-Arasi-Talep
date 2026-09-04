// jest.config.js
// Minimal Jest kurulumu — yalnızca domain/ ve infrastructure/ altındaki saf
// TypeScript birimlerini test eder (React Native bileşen testleri, Detox/RNTL
// entegrasyonu, ve Maestro E2E ayrı bir iş — PDF görev listesi E9).
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  // react-native paketi node ortamında import edilemiyor (Flow/JSX kaynak) —
  // testlerimizin tek ihtiyacı olan Dimensions.get için minimal bir sahte
  // sürüm kullanılıyor (bkz. src/__mocks__/react-native.ts dosya başı notu).
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
  },
};
