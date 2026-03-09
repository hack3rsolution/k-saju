/**
 * Supabase Edge Function: timing-advisor
 * Deno runtime — no Node.js APIs
 *
 * POST /functions/v1/timing-advisor
 * Authorization: Bearer <supabase_anon_key>
 *
 * Body: TimingRequest
 * Response: TimingResponse
 *
 * Rate limit: Free tier — 1 per calendar month (tracked via user_metadata)
 * Cache:      Persistent DB cache (report_cache table) per (userId, category, YYYY-MM)
 *             Monthly reports expire on the 1st of the following month.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompts.ts';
import type { TimingRequest, TimingResponse, ClaudeTimingOutput } from './types.ts';

// ── Rate limit (in-memory, per instance) ──────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(userId) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + RATE_WINDOW_MS; }
  rec.count++;
  rateLimitMap.set(userId, rec);
  return rec.count <= RATE_LIMIT;
}

// ── DB cache helpers ──────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const TIMING_REPORT_TYPE = 'timing';

function timingPeriodKey(category: string, refDate: string, lang: string): { periodKey: string; expiresAt: Date } {
  const ym = refDate.slice(0, 7); // "YYYY-MM"
  const [y, m] = ym.split('-').map(Number);
  const expiresAt = m === 12
    ? new Date(Date.UTC(y + 1, 0, 1))
    : new Date(Date.UTC(y, m, 1));
  return { periodKey: `${category}:${ym}:${lang}`, expiresAt };
}

async function getCachedTiming(
  adminClient: SupabaseClient,
  userId: string,
  periodKey: string,
): Promise<ClaudeTimingOutput | null> {
  const { data, error } = await adminClient
    .from('report_cache')
    .select('report_data')
    .eq('user_id', userId)
    .eq('report_type', TIMING_REPORT_TYPE)
    .eq('period_key', periodKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error('[timing-advisor] cache read error:', error.message);
    return null;
  }
  return data?.report_data ?? null;
}

async function saveTimingToCache(
  adminClient: SupabaseClient,
  userId: string,
  periodKey: string,
  data: ClaudeTimingOutput,
  expiresAt: Date,
): Promise<void> {
  const { error } = await adminClient.from('report_cache').upsert(
    {
      user_id: userId,
      report_type: TIMING_REPORT_TYPE,
      period_key: periodKey,
      report_data: data,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'user_id,report_type,period_key' },
  );
  if (error) {
    console.error('[timing-advisor] cache write error:', error.message);
  }
}

// ── Claude caller ─────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeTimingOutput> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const raw = data.content?.[0]?.text ?? '';

  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude response had no JSON: ${cleaned.slice(0, 200)}`);

  let parsed: Partial<ClaudeTimingOutput>;
  try {
    parsed = JSON.parse(jsonMatch[0]) as Partial<ClaudeTimingOutput>;
  } catch {
    const tightMatch = cleaned.match(/\{[^{}]*\}/);
    if (!tightMatch) throw new Error(`Claude JSON parse failed: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(tightMatch[0]) as Partial<ClaudeTimingOutput>;
  }
  return {
    score:    Math.max(1, Math.min(10, Number(parsed.score ?? 5))),
    headline: String(parsed.headline ?? '').slice(0, 120),
    reasons:  Array.isArray(parsed.reasons)  ? parsed.reasons.slice(0, 3).map(String)  : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions.slice(0, 2).map(String) : [],
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_FRAMES    = new Set(['kr', 'cn', 'jp', 'en', 'es', 'in']);
const VALID_CATS      = new Set(['business', 'investment', 'romance', 'relocation']);

function validateRequest(body: unknown): TimingRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (!b.chart || typeof b.chart !== 'object') throw new Error('Missing chart');
  if (!VALID_FRAMES.has(b.frame as string))     throw new Error('Invalid frame');
  if (!VALID_CATS.has(b.category as string))    throw new Error('Invalid category');
  if (!b.refDate || typeof b.refDate !== 'string') throw new Error('Missing refDate');
  return b as unknown as TimingRequest;
}

// ── Monthly limit helpers ─────────────────────────────────────────────────────

function currentMonth(date: string): string {
  return date.slice(0, 7); // "2026-03"
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY     = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  let userId: string;
  let userMeta: Record<string, unknown> = {};
  let isDevAnon = false;

  if (authError || !user) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token && token === SUPABASE_ANON_KEY) {
      userId = '00000000-0000-4000-8000-000000000000';
      userMeta = { is_premium: true };
      isDevAnon = true;
    } else {
      return errorResponse('Unauthorized', 401);
    }
  } else {
    userId = user.id;
    userMeta = user.user_metadata ?? {};
  }

  // ── Burst rate limit ───────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return errorResponse('Rate limit exceeded. Try again in a minute.', 429);
  }

  // ── Parse & validate ───────────────────────────────────────────────────────
  let request: TimingRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // Admin client for cache operations (bypasses RLS)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ── DB cache check (before limit check — cached results always accessible) ─
  const userLanguage = (request as unknown as Record<string, unknown>).userLanguage as string | undefined;
  const { periodKey, expiresAt } = timingPeriodKey(request.category, request.refDate, userLanguage ?? 'ko');
  const cached = await getCachedTiming(adminClient, userId, periodKey);
  if (cached) {
    console.log(`[timing-advisor] cache hit: ${userId} ${periodKey}`);
    return jsonResponse({
      ok: true,
      cached: true,
      advice: cached,
    } satisfies TimingResponse);
  }

  // ── Premium / entitlement check (only applies to new generation) ───────────
  const isPremium = userMeta.is_premium === true || userMeta.has_timing_advisor === true;

  if (!isPremium) {
    const thisMonth = currentMonth(request.refDate);
    if (userMeta.last_timing_month === thisMonth) {
      return jsonResponse({
        ok: true,
        cached: false,
        limitReached: true,
        advice: { score: 0, headline: '', reasons: [], cautions: [] },
      } satisfies TimingResponse);
    }
  }

  // ── Build prompts & call Claude ────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(request.frame, userLanguage);
  const userPrompt   = buildUserPrompt(request);

  let advice: ClaudeTimingOutput;
  try {
    advice = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    const msg = (e as Error).message ?? 'unknown';
    console.error('[timing-advisor] Claude error:', msg);
    return errorResponse(`AI analysis failed: ${msg}`, 502);
  }

  // ── Save to DB cache (fire-and-forget) ────────────────────────────────────
  saveTimingToCache(adminClient, userId, periodKey, advice, expiresAt)
    .catch((e: unknown) => console.error('[timing-advisor] cache save error:', e));

  // ── Mark monthly usage for free tier ──────────────────────────────────────
  if (!isPremium && !isDevAnon) {
    supabase.auth
      .updateUser({ data: { last_timing_month: currentMonth(request.refDate) } })
      .catch((e: unknown) => console.error('[timing-advisor] updateUser error:', e));
  }

  return jsonResponse({
    ok: true,
    cached: false,
    advice,
  } satisfies TimingResponse);
});
