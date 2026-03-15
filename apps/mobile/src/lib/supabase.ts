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
  },
});

/**
 * Returns a valid access token from the Supabase client.
 * - If the stored token expires within 60 s, forces a refresh via refreshSession().
 * - Falls back to the anon key so Edge Functions can identify the caller as a
 *   guest user (the edge functions accept the anon key and assign a fixed guest
 *   userId instead of returning 401).
 *
 * On Android the auto-refresh timer may not have fired yet after a cold start,
 * so we explicitly check expiry and refresh rather than relying on the timer.
 */
export async function getFreshToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Force refresh if the token has already expired or expires within 60 s.
      const expiresAt = session.expires_at ?? 0;
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt - nowSec < 60) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed?.session?.access_token) return refreshed.session.access_token;
      }
      return session.access_token;
    }
  } catch { /* ignore */ }
  return supabaseAnonKey;
}
