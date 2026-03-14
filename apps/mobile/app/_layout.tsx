import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLanguageStore } from '../src/store/languageStore';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { useNotifications } from '../src/hooks/useNotifications';
import { useAuthStore } from '../src/store/authStore';
import { initializePurchases, syncEntitlements } from '../src/lib/purchases';
import { useEntitlementStore } from '../src/store/entitlementStore';
import { configureNotifications } from '../src/lib/notifications';

// Configure notification handler at module load (before any render)
configureNotifications();

export default function RootLayout() {
  useAuthGuard();
  useNotifications();
  useLanguageStore(); // triggers rehydration which applies persisted language

  // Hide splash screen immediately — no conditions, no waiting
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const session = useAuthStore((s) => s.session);

  // Initialise RevenueCat and sync entitlements whenever the user session changes
  useEffect(() => {
    if (session?.user?.id) {
      const isDevBypass = process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';
      const isDevUser = session.user.id === '00000000-0000-4000-8000-000000000000';
      if (isDevBypass && isDevUser) {
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
