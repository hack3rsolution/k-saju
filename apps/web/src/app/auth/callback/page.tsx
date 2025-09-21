'use client';
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const run = async () => {
      try {
        const code = params.get('code');
        if (!code) {
          setMsg('Missing auth code. Redirecting to login…');
          router.replace('/login');
          return;
        }

        // Supabase JS v2: exchangeCodeForSession
        const { error } = await (supabaseBrowser().auth as any).exchangeCodeForSession({
          authCode: code,
        });

        if (error) {
          console.error('[callback] exchange error:', error);
          setMsg(error.message ?? 'Sign-in failed. Redirecting to login…');
          setTimeout(() => router.replace('/login'), 1200);
          return;
        }

        setMsg('Signed in! Redirecting…');
        router.replace('/account');
      } catch (e: any) {
        console.error('[callback] unexpected error:', e);
        setMsg(e?.message ?? 'Unexpected error. Redirecting to login…');
        setTimeout(() => router.replace('/login'), 1200);
      }
    };
    run();
  }, [params, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="rounded-xl border bg-white px-6 py-4 shadow-sm text-sm text-gray-700">
        {msg}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="rounded-xl border bg-white px-6 py-4 shadow-sm text-sm text-gray-700">
          Preparing callback…
        </div>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
