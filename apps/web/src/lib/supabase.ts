import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(url, anon, {
  auth: {
    // PKCE 플로우: /auth/callback 에서 exchangeCodeForSession 사용
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
