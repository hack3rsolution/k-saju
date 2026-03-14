import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import i18n from '../src/i18n';
import { useLanguageStore } from '../src/store/languageStore';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { useNotifications } from '../src/hooks/useNotifications';
import { useAuthStore } from '../src/store/authStore';
import { initializePurchases, syncEntitlements } from '../src/lib/purchases';
import { useEntitlementStore } from '../src/store/entitlementStore';
import { configureNotifications } from '../src/lib/notifications';

// Configure notification handler at module load (before any render)
configureNotifications();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useAuthGuard();
  useNotifications();

  // Wait for i18n to be initialized and languageStore to rehydrate
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);
  useLanguageStore(); // triggers rehydration which applies persisted language
  useEffect(() => {
    if (i18n.isInitialized) {
      // Already initialized synchronously (initImmediate: false) — just mark ready.
      setI18nReady(true);
    } else {
      // Fallback: wait for async init (should not happen with initImmediate: false).
      const handler = () => setI18nReady(true);
      i18n.on('initialized', handler);
      return () => { i18n.off('initialized', handler); };
    }
  }, []);

  const session = useAuthStore((s) => s.session);

  // Initialise RevenueCat and sync entitlements whenever the user session changes
  useEffect(() => {
    if (session?.user?.id) {
      const isDevBypass = process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';
      const isDevUser = session.user.id === '00000000-0000-4000-8000-000000000000';
      if (isDevBypass && isDevUser) {
        // Grant all entitlements for the dev user
        useEntitlementStore.getState().setEntitlements(true, {
          deepCompatibility: true,
          careerWealth: true,
          daewoonPdf: true,
          nameAnalysis: true,
          timingAdvisor: true,
        });
      } else {
        initializePurchases(session.user.id);
        syncEntitlements().catch(() => {});
      }
    } else {
      useEntitlementStore.getState().reset();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!i18nReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="compatibility" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
