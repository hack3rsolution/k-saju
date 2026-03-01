/**
 * notifications.ts — Expo Notifications wrapper.
 *
 * Responsibilities:
 *  - Configure notification handler (call configureNotifications() once at startup)
 *  - Request permission
 *  - Acquire Expo push token → save to Supabase push_tokens table
 *  - Schedule / cancel the local daily 8am fortune reminder
 *
 * Env vars:
 *   EXPO_PUBLIC_PROJECT_ID — EAS project ID (for getExpoPushTokenAsync)
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// ── Notification handler (call once at app start) ─────────────────────────────

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('daily-fortune', {
      name: 'Daily Fortune',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
    });
  }
}

// ── Permission ────────────────────────────────────────────────────────────────

/** Returns true if notifications are granted after the request. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Check current permission status without prompting. */
export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ── Push token ────────────────────────────────────────────────────────────────

/** Acquire Expo push token and save it to the push_tokens table. */
export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    const projectId =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      process.env.EXPO_PUBLIC_PROJECT_ID;

    const { data: tokenData } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token: tokenData,
        platform: Platform.OS,
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );
  } catch (e) {
    console.warn('[notifications] push token registration failed:', e);
  }
}

/** Update notifications_enabled flag for all tokens belonging to the user. */
export async function setTokensEnabled(
  userId: string,
  enabled: boolean,
): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ notifications_enabled: enabled })
    .eq('user_id', userId);
}

// ── Local daily notification ──────────────────────────────────────────────────

const DAILY_NOTIFICATION_ID_KEY = 'daily-fortune-notif';

/** Schedule a repeating daily 8:00am local notification. */
export async function scheduleDailyNotification(): Promise<void> {
  // Cancel any existing daily notification before rescheduling
  await cancelDailyNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIFICATION_ID_KEY,
    content: {
      title: '🌙 오늘의 운세',
      body: 'Your daily fortune reading is ready — check your cosmic energy.',
      data: { screen: '/(tabs)/home' },
      ...(Platform.OS === 'android' ? { channelId: 'daily-fortune' } : {}),
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

/** Cancel the daily scheduled notification. */
export async function cancelDailyNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    DAILY_NOTIFICATION_ID_KEY,
  ).catch(() => {
    // Ignore if not scheduled
  });
}

/** Returns true if the daily notification is currently scheduled. */
export async function isDailyNotificationScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === DAILY_NOTIFICATION_ID_KEY);
}
