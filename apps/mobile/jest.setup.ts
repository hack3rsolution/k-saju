/**
 * jest.setup.ts — global mocks for native modules.
 * Runs before every test file (setupFiles in jest.config.js).
 */

// ── Supabase — mock at package level so src/lib/supabase resolves cleanly ─────

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser:    jest.fn().mockResolvedValue({ data: { user: null },    error: null }),
      signOut:    jest.fn().mockResolvedValue({ error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: { user: null },    error: null }),
      signInWithOtp:   jest.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: null }, error: null }),
      signInWithIdToken: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn().mockReturnValue({
      upsert:  jest.fn().mockResolvedValue({ data: null, error: null }),
      insert:  jest.fn().mockResolvedValue({ data: null, error: null }),
      select:  jest.fn().mockReturnThis(),
      eq:      jest.fn().mockResolvedValue({ data: [], error: null }),
      update:  jest.fn().mockReturnThis(),
    }),
  })),
}));

// ── expo-notifications ────────────────────────────────────────────────────────

jest.mock('expo-notifications', () => ({
  setNotificationHandler:         jest.fn(),
  setNotificationChannelAsync:    jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync:            jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync:        jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync:          jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  scheduleNotificationAsync:      jest.fn().mockResolvedValue('mock-notif-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync:    jest.fn().mockResolvedValue([]),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 },
  SchedulableTriggerInputTypes: { CALENDAR: 'CALENDAR', DAILY: 'DAILY' },
}));

// ── expo-device ───────────────────────────────────────────────────────────────

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  modelName: 'iPhone 15',
}));

// ── expo-constants ────────────────────────────────────────────────────────────

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: { eas: { projectId: 'test-project-id' } },
  },
  easConfig: null,
}));

// ── react-native-purchases ────────────────────────────────────────────────────

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel:       jest.fn(),
    configure:         jest.fn(),
    getCustomerInfo:   jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getOfferings:      jest.fn().mockResolvedValue({ current: null }),
    purchasePackage:   jest.fn().mockResolvedValue({ customerInfo: { entitlements: { active: {} } } }),
    restorePurchases:  jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  },
  LOG_LEVEL:    { ERROR: 'error' },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL' },
}));

// ── expo-sharing ──────────────────────────────────────────────────────────────

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync:       jest.fn().mockResolvedValue(undefined),
}));

// ── expo-print ────────────────────────────────────────────────────────────────

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: '/tmp/test.pdf' }),
}));

// ── expo-web-browser ──────────────────────────────────────────────────────────

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync:     jest.fn().mockResolvedValue({ type: 'cancel' }),
}));

// ── expo-auth-session ─────────────────────────────────────────────────────────

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('ksaju://auth/callback'),
}));

// ── expo-localization ─────────────────────────────────────────────────────────

jest.mock('expo-localization', () => ({
  getLocales:     jest.fn().mockReturnValue([{ languageTag: 'en' }]),
  locale:         'en-US',
  timezone:       'America/New_York',
  isRTL:          false,
}));

// ── @react-native-async-storage/async-storage ─────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
