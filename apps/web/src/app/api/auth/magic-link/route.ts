import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/auth/magic-link
// body: { email: string, redirectTo?: string }
export async function POST(req: Request) {
  try {
    const { email, redirectTo } = await req.json() as { email?: string; redirectTo?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Supabase가 직접 이메일을 발송하게 함 (server key 사용)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
      },
    });

    if (error) {
      console.error('[magic-link] supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    console.error('[magic-link] route error:', e);
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
