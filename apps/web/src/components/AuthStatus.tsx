'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseBrowser(); // ← 클라이언트 생성

    // 초기 유저 로드
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 구독
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
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    setEmail(null);
  };

  if (loading) return <span className="text-sm text-gray-500">Loading…</span>;

  if (!email) {
    return (
      <a href="/login" className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm">
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 hidden sm:inline">{email}</span>
      <button onClick={signOut} className="px-3 py-1.5 rounded-md bg-gray-200 text-sm hover:bg-gray-300">
        Sign out
      </button>
    </div>
  );
}
