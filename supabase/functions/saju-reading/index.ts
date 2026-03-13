/**
 * Supabase Edge Function: saju-reading
 * Deno runtime — no Node.js APIs
 *
 * POST /functions/v1/saju-reading
 * Authorization: Bearer <supabase_anon_key>  (JWT verified by Supabase)
 *
 * Body: SajuReadingRequest (see types.ts)
 * Response: SajuReadingResponse
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompts.ts';
import { callClaude } from './claude.ts';
import { getCachedReading, storeReading, getRecentFeedback } from './cache.ts';
import type { SajuReadingRequest, SajuReadingResponse } from './types.ts';

// ── Rate limit state (in-memory, per instance) ────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;       // requests
const RATE_WINDOW_MS = 60_000; // per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(userId) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + RATE_WINDOW_MS; }
  rec.count++;
  rateLimitMap.set(userId, rec);
  return rec.count <= RATE_LIMIT;
}

// ── Request validation ────────────────────────────────────────────────────────

const VALID_FRAMES = new Set(['kr', 'cn', 'jp', 'en', 'es', 'in']);
const VALID_TYPES  = new Set(['daily', 'weekly', 'monthly', 'annual', 'daewoon']);

function validateRequest(body: unknown): SajuReadingRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;

  if (!b.chart || typeof b.chart !== 'object') throw new Error('Missing chart');
  if (!VALID_FRAMES.has(b.frame as string)) throw new Error('Invalid frame');
  if (!VALID_TYPES.has(b.type as string)) throw new Error('Invalid type');
  if (!b.refDate || typeof b.refDate !== 'string') throw new Error('Missing refDate');

  return b as unknown as SajuReadingRequest;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // ── Env ───────────────────────────────────────────────────────────────────
  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth — extract user from JWT ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const authToken = authHeader.replace('Bearer ', '').trim();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // Dev bypass: anon key used as bearer token (signInDev()) → treat as guest
  let userId: string;
  if (SUPABASE_ANON_KEY && authToken === SUPABASE_ANON_KEY) {
    userId = '00000000-0000-4000-8000-000000000000';
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);
    userId = user.id;
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return errorResponse('Rate limit exceeded. Try again in a minute.', 429);
  }

  // ── Parse & validate request ──────────────────────────────────────────────
  let request: SajuReadingRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // ── Cache lookup ──────────────────────────────────────────────────────────
  const cached = await getCachedReading(
    supabase,
    userId,
    request.type,
    request.refDate,
    request.frame,
    request.userLanguage,
  );

  if (cached) {
    const response: SajuReadingResponse = {
      ok: true,
      cached: true,
      readingId: cached.id,
      reading: {
        summary: cached.summary,
        details: cached.details,
        luckyItems: cached.luckyItems as SajuReadingResponse['reading']['luckyItems'],
      },
    };
    return jsonResponse(response);
  }

  // ── Fetch recent user feedback for prompt personalization ─────────────────
  const recentFeedback = await getRecentFeedback(supabase, userId, 5).catch(() => []);

  // ── Build prompts ─────────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(request.frame, recentFeedback, request.userLanguage);
  const userPrompt   = buildUserPrompt(request);

  // ── Claude API call ───────────────────────────────────────────────────────
  let output: Awaited<ReturnType<typeof callClaude>>;
  try {
    output = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY, request.type, request.userLanguage);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error('[saju-reading] Claude error:', msg);
    // Transient server errors (overload / billing) → 503; parse/logic errors → 502
    if (
      msg.includes('credit balance is too low') ||
      msg.includes('insufficient_quota') ||
      msg.includes('overloaded_error') ||
      msg.includes('error 529') ||
      msg.includes('error 500')
    ) {
      return errorResponse('Service temporarily unavailable. Please try again later.', 503);
    }
    return errorResponse('AI reading failed. Please try again.', 502);
  }

  // ── Persist to DB ─────────────────────────────────────────────────────────
  let readingId: string | null = null;
  try {
    readingId = await storeReading(
      supabase,
      userId,
      request.type,
      request.refDate,
      request.frame,
      output,
      output.rawContent,
      request.userLanguage,
    );
  } catch (e) {
    console.error('[saju-reading] store error:', e);
  }

  // ── Return response ───────────────────────────────────────────────────────
  const response: SajuReadingResponse = {
    ok: true,
    cached: false,
    readingId,
    reading: {
      summary: output.summary,
      details: output.details,
      luckyItems: output.luckyItems,
    },
  };

  return jsonResponse(response);
});
