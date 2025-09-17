'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setErr('Missing auth code in URL');
      return;
    }
    const run = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setErr(error.message);
        return;
      }
      if (data?.session) router.replace('/');
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {!err ? (
          <p className="text-gray-700">Completing sign-in…</p>
        ) : (
          <p className="text-red-600">Auth error: {err}</p>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Preparing…</p>
      </main>
    }>
      <CallbackInner />
    </Suspense>
  );
}
