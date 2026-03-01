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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
}));
