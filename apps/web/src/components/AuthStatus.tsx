'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 현재 세션 로드 + 상태 변화 구독
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null);
  };

  if (loading) return <span className="text-sm text-gray-500">loading…</span>;

  if (!email) {
    return (
      <a
        href="/login"
        className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 hidden sm:inline">{email}</span>
      <button
        onClick={signOut}
        className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
