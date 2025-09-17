'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);
    try {
      // 브라우저에서 Supabase로 직접 호출 (Codespaces 서버 DNS 이슈 우회)
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      console.error('[magic-link] error', err);
      setError(err?.message ?? 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">
          Enter your email to receive a magic link.
        </h1>

        {!sent ? (
          <form onSubmit={sendMagicLink} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gray-900 text-white py-3 font-medium disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
            {error && <p className="text-sm text-red-600">Error: {error}</p>}
          </form>
        ) : (
          <p className="text-green-700">Magic link sent. Check your inbox.</p>
        )}

        <div className="mt-6">
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
