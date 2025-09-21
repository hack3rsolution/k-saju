import { createClient } from '@supabase/supabase-js';

/**
 * 서버 전용 Supabase 클라이언트
 * - 서비스 롤 키 사용: 절대 클라이언트에서 import 하지 말 것!
 * - 이 파일은 app router의 route handler 등 서버 코드에서만 import 하세요.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (server only)');
}

/** Admin 권한(서비스 롤) 클라이언트 */
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** 필요 시: 서버에서 익명키 기반 read-only가 필요할 때 사용 (옵션) */
// export const supabaseServer = createClient(
//   SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
//   { auth: { persistSession: false, autoRefreshToken: false } }
// );
