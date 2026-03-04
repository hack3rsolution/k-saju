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
 * Cache:      In-memory per Edge Function instance (same day + category)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompts.ts';
import type { TimingRequest, TimingResponse, ClaudeTimingOutput } from './types.ts';

// ── In-memory cache (per instance) ───────────────────────────────────────────

const instanceCache = new Map<string, { data: ClaudeTimingOutput; expiresAt: number }>();

function cacheKey(userId: string, category: string, date: string) {
  return `${userId}:${category}:${date}`;
}

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
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
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

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude response had no JSON');

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ClaudeTimingOutput>;
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

  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // ── Burst rate limit ───────────────────────────────────────────────────────
  if (!checkRateLimit(user.id)) {
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

  // ── Premium / entitlement check ────────────────────────────────────────────
  const meta = user.user_metadata ?? {};
  const isPremium = meta.is_premium === true || meta.has_timing_advisor === true;

  if (!isPremium) {
    const thisMonth = currentMonth(request.refDate);
    if (meta.last_timing_month === thisMonth) {
      // Return the cached last advice if stored, otherwise limit reached
      return jsonResponse({
        ok: true,
        cached: false,
        limitReached: true,
        advice: { score: 0, headline: '', reasons: [], cautions: [] },
      } satisfies TimingResponse);
    }
  }

  // ── Instance-level cache ───────────────────────────────────────────────────
  const key = cacheKey(user.id, request.category, request.refDate);
  const cached = instanceCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return jsonResponse({
      ok: true,
      cached: true,
      advice: cached.data,
    } satisfies TimingResponse);
  }

  // ── Build prompts & call Claude ────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(request.frame, (request as { userLanguage?: string }).userLanguage);
  const userPrompt   = buildUserPrompt(request);

  let advice: ClaudeTimingOutput;
  try {
    advice = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[timing-advisor] Claude error:', e);
    return errorResponse('AI analysis failed. Please try again.', 502);
  }

  // ── Store in instance cache (24h) ──────────────────────────────────────────
  instanceCache.set(key, { data: advice, expiresAt: Date.now() + 24 * 3_600_000 });

  // ── Mark monthly usage for free tier ──────────────────────────────────────
  if (!isPremium) {
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
