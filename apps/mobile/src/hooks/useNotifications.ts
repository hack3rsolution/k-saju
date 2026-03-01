/**
 * useNotifications — global notification hook, mounted in _layout.tsx.
 *
 * • Registers the Expo push token whenever the user session becomes available.
 * • Listens for notification response (tap) events and deep-links to the
 *   target screen encoded in `notification.request.content.data.screen`.
 */
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { registerPushToken } from '../lib/notifications';

export function useNotifications(): void {
  const { session } = useAuthStore();
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  // Register push token whenever user signs in
  useEffect(() => {
    if (session?.user?.id) {
      registerPushToken(session.user.id).catch(() => {});
    }
  }, [session?.user?.id]);

  // Deep-link handler — runs when user taps a notification
  useEffect(() => {
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const screen = data?.screen as string | undefined;
        if (screen) {
          // Small delay so the app finishes mounting before navigating
          setTimeout(() => {
            router.push(screen as never);
          }, 300);
        }
      });

    return () => {
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(responseListenerRef.current);
      }
    };
  }, []);
}
