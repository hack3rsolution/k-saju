'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Completing sign-in…');

  useEffect(() => {
    const code = sp.get('code');
    if (!code) {
      setMsg('Missing auth code in URL.');
      return;
    }

    (async () => {
      try {
        // Supabase JS v2: exchangeCodeForSession({ authCode })
        const { error } = await (supabase.auth as any).exchangeCodeForSession({
          authCode: code,
        });
        if (error) {
          setMsg(`Sign-in failed: ${error.message}`);
          return;
        }
        setMsg('Signed in! Redirecting…');
        router.replace('/account'); // 또는 '/' 로 바꾸셔도 됩니다.
      } catch (e: any) {
        setMsg(`Unexpected error: ${e?.message ?? e}`);
      }
    })();
  }, [sp, router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <p className="text-gray-600">{msg}</p>
    </div>
  );
}
