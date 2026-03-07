import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

/**
 * Returns the current access token from the Supabase client (auto-refreshed).
 * Falls back to the anon key so Edge Functions can identify the caller as a
 * guest user (the edge functions accept the anon key and assign a fixed guest
 * userId instead of returning 401).
 *
 * NOTE: do NOT pass session.access_token as a fallback — if the token in the
 * Zustand store is expired and getSession() returns null, passing the stale
 * token as fallback causes "Invalid JWT" 401 errors instead of the intended
 * anon-key guest bypass.
 */
export async function getFreshToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch { /* ignore */ }
  return supabaseAnonKey;
}

