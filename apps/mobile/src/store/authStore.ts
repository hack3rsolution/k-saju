import { Platform } from 'react-native';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { useEntitlementStore } from './entitlementStore';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  session: Session | null;
  /** true once the initial getSession() resolves */
  initialized: boolean;
  setSession: (session: Session | null) => void;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  /** DEV only: sign in as dev@k-saju.com (real Supabase session) */
  setDevSession: () => Promise<void>;
  /** Update onboarding_completed in the in-memory session (works for real & dev sessions) */
  setOnboardingCompleted: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),

  signInWithMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'ksaju://auth/callback' },
    });
    if (error) throw error;
  },

  signInWithGoogle: async () => {
    const redirectTo = makeRedirectUri({ scheme: 'ksaju', path: 'auth/callback' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;

    const code = new URL(result.url).searchParams.get('code');
    if (!code) return;

    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    set({
      session: sessionData.session,
      user: sessionData.session?.user ?? null,
      initialized: true,
    });
  },

  signInWithApple: async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is iOS only');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const AppleAuth = require('expo-apple-authentication');
    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
    set({ session: data.session, user: data.session?.user ?? null, initialized: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  setOnboardingCompleted: (value) =>
    set((state) => {
      if (!state.user || !state.session) return {};
      const meta = { ...state.user.user_metadata, onboarding_completed: value };
      const user = { ...state.user, user_metadata: meta };
      const session = { ...state.session, user };
      return { user, session };
    }),

  setDevSession: async () => {
    if (!__DEV__) return;
    const DEV_EMAIL = 'dev@k-saju.com';
    const DEV_PASSWORD = 'devpassword123';
    const DEV_META = {
      onboarding_completed: true,
      birth_year: 1990,
      birth_month: 6,
      birth_day: 15,
      birth_hour: 12,
      gender: 'M',
      cultural_frame: 'en',
      is_premium: true,
      has_timing_advisor: true,
    };

    // Try sign-in first; if user doesn't exist, sign up then sign in
    let result = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });

    if (result.error) {
      // User may not exist — attempt sign-up (email confirm must be disabled in Supabase)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        options: { data: DEV_META },
      });
      if (signUpError) throw signUpError;

      // signUp returns a session immediately only when email confirmation is disabled.
      // If identities is empty, the user already existed but wasn't confirmed.
      if (signUpData.session) {
        // Email confirm disabled → session returned directly
        set({
          session: signUpData.session,
          user: signUpData.session.user ?? null,
          initialized: true,
        });
        return;
      }

      result = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });
    }

    if (result.error) {
      if (result.error.message?.toLowerCase().includes('email not confirmed')) {
        console.warn(
          '[DEV] Supabase "Email not confirmed" 에러 발생.\n' +
          '→ Supabase Dashboard > Authentication > Providers > Email\n' +
          '→ "Confirm email" 옵션을 OFF로 설정한 뒤 다시 시도하세요.'
        );
      }
      throw result.error;
    }

    // Ensure user_metadata has the dev birth data and premium flags
    let finalUser = result.data.session?.user ?? null;
    if (!finalUser?.user_metadata?.birth_year || !finalUser?.user_metadata?.is_premium) {
      const { data: updateData } = await supabase.auth.updateUser({ data: DEV_META });
      if (updateData?.user) finalUser = updateData.user;
    }

    set({
      session: result.data.session ? { ...result.data.session, user: finalUser! } : null,
      user: finalUser,
      initialized: true,
    });

    // Force all entitlements on for dev session
    useEntitlementStore.getState().setEntitlements(true, {
      deepCompatibility: true,
      careerWealth: true,
      daewoonPdf: true,
      nameAnalysis: true,
      timingAdvisor: true,
    });
  },
}));
