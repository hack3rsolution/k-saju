'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function HeaderAuth() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseBrowser(); // ← 함수 호출해서 클라이언트 생성

    // 1) 최초 유저 로드
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    });

    // 2) 인증 상태 변경 구독
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
