// Register dayjs plugins globally before any other module uses dayjs
import '../src/lib/dayjs';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../src/i18n';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { useNotifications } from '../src/hooks/useNotifications';
import { useAuthStore } from '../src/store/authStore';
import { initializePurchases, syncEntitlements } from '../src/lib/purchases';
import { useEntitlementStore } from '../src/store/entitlementStore';
import { configureNotifications } from '../src/lib/notifications';
import { useLanguageStore, LANGUAGE_STORAGE_KEY } from '../src/store/languageStore';
import type { SupportedLanguage } from '../src/i18n';

// Configure notification handler at module load (before any render)
configureNotifications();

SplashScreen.preventAutoHideAsync();

const DEV_BYPASS = process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';

export default function RootLayout() {
  useAuthGuard();
  useNotifications();

  const session = useAuthStore((s) => s.session);
  const { setLanguage } = useLanguageStore();

  // Restore persisted language on startup
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved) setLanguage(saved as SupportedLanguage);
    }).catch(() => {});
  }, []);

  // Initialise RevenueCat and sync entitlements whenever the user session changes
  useEffect(() => {
    if (DEV_BYPASS) {
      useEntitlementStore.getState().setEntitlements(true, {
        deepCompatibility: true,
        careerWealth: true,
        daewoonPdf: true,
        nameAnalysis: true,
        timingAdvisor: true,
      });
      return;
    }
    if (session?.user?.id) {
      initializePurchases(session.user.id);
      // Skip RevenueCat sync for dev session — entitlements are set in setDevSession()
      const devEmail = process.env.EXPO_PUBLIC_DEV_EMAIL ?? 'dev@k-saju.com';
      if (process.env.APP_ENV !== 'production' && session.user.email === devEmail) {
        useEntitlementStore.getState().setEntitlements(true, {
          deepCompatibility: true,
          careerWealth: true,
          daewoonPdf: true,
          nameAnalysis: true,
          timingAdvisor: true,
        });
      } else {
        syncEntitlements().catch(() => {});
      }
    } else {
      useEntitlementStore.getState().reset();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="compatibility" />
        <Stack.Screen name="fortune-chat/[fortuneId]" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
