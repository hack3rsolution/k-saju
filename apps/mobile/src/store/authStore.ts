import { Platform } from 'react-native';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

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
  /** DEV only: bypass auth with a mock session */
  setDevSession: () => void;
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

  setDevSession: () => {
    if (!__DEV__) return;
    const mockUser = {
      id: '00000000-0000-4000-8000-000000000000',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'dev@k-saju.local',
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        onboarding_completed: true,
        // Default birth data so useFortune can rebuild the chart without DB
        birth_year: 1990,
        birth_month: 6,
        birth_day: 15,
        birth_hour: 12,
        gender: 'M',
        cultural_frame: 'en',
      },
      app_metadata: {},
    } as unknown as User;
    const mockSession = {
      access_token: 'dev-access-token',
      refresh_token: 'dev-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: mockUser,
    } as unknown as Session;
    set({ session: mockSession, user: mockUser, initialized: true });
  },
}));
