import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuthGuard() {
  const { session, initialized, setSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Bootstrap session and subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect based on auth + onboarding state
  useEffect(() => {
    if (!initialized) return;

    const inAuth = (segments[0] as string) === '(auth)';
    const inOnboarding = (segments[0] as string) === '(onboarding)';
    const onboardingDone = session?.user?.user_metadata?.onboarding_completed === true;

    if (!session) {
      // Not signed in → login
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!onboardingDone) {
      // Signed in but onboarding not complete → birth-input
      if (!inOnboarding) router.replace('/(onboarding)/birth-input');
    } else {
      // Signed in + onboarded → home (skip auth/onboarding screens)
      if (inAuth || inOnboarding) router.replace('/(tabs)/home');
    }
  }, [session, initialized, segments, router]);
}
