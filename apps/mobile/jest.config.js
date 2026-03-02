/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  // Run mocks before each test file
  setupFiles: ['./jest.setup.ts'],

  // Only run unit tests from __tests__/ (Detox E2E lives in e2e/)
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],

  // Resolve monorepo workspace packages to their source
  moduleNameMapper: {
    '^@k-saju/saju-engine$':
      '<rootDir>/../../packages/saju-engine/src/index.ts',
  },

  // Allow jest to transform these ESM/Flow packages.
  // Notes:
  //  - No trailing '/' inside the lookahead so 'expo(nent)?' matches 'expo-modules-core' etc.
  //  - Leading '\\.pnpm' exclusion handles pnpm virtual-store paths:
  //      node_modules/.pnpm/@react-native+js-polyfills@x/node_modules/…
  //    so the inner node_modules/ segment is evaluated on its own.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '\\.pnpm' +
      '|(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|zustand' +
      '|i18next' +
      '|react-i18next' +
      '))',
  ],

  // Coverage: pure business-logic that has unit tests.
  // Excluded from measurement (but still exercised via other tests):
  //   components/hooks  → Detox E2E
  //   authStore         → async OAuth/Supabase methods need integration tests
  //   purchases.ts      → RevenueCat SDK needs integration tests
  //   thin stores       → no real logic to measure
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/i18n/**',
    '!src/components/**',
    '!src/hooks/**',
    '!src/lib/purchases.ts',
    '!src/store/authStore.ts',       // async OAuth methods are integration territory
    '!src/store/languageStore.ts',
    '!src/store/onboardingStore.ts',
  ],

  coverageThreshold: {
    global: { lines: 70, functions: 85 },
  },
};
