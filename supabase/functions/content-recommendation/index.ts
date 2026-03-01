/**
 * Supabase Edge Function: content-recommendation
 * Deno runtime
 *
 * POST /functions/v1/content-recommendation
 * Authorization: Bearer <user access token>
 *
 * Returns music / book / travel recommendations based on the user's
 * dominant Five Element (오행) and Day Master (일간).
 * Results are cached in-memory for 24 hours per (dayStem, frame) pair.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  getDominantElement,
  FALLBACK,
} from './prompts.ts';
import type {
  ContentRecommendationRequest,
  ContentRecommendationResponse,
  ClaudeRecommendationOutput,
  CulturalFrame,
} from './types.ts';

// ── In-memory cache (24 h TTL) ────────────────────────────────────────────────

interface CacheEntry {
  data: ClaudeRecommendationOutput;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(key: string): ClaudeRecommendationOutput | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key: string, data: ClaudeRecommendationOutput): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Rate limit ────────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(userId) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + RATE_WINDOW_MS; }
  rec.count++;
  rateLimitMap.set(userId, rec);
  return rec.count <= RATE_LIMIT;
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_FRAMES = new Set<CulturalFrame>(['kr', 'cn', 'jp', 'en', 'es', 'in']);

function validateRequest(body: unknown): ContentRecommendationRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (typeof b.dayStem !== 'string' || !b.dayStem) throw new Error('Missing dayStem');
  if (!VALID_FRAMES.has(b.frame as CulturalFrame)) throw new Error('Invalid frame');
  if (!b.elementBalance || typeof b.elementBalance !== 'object') throw new Error('Missing elementBalance');
  return b as unknown as ContentRecommendationRequest;
}

// ── Claude API call ───────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 700;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeRecommendationOutput> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const raw = data.content?.[0]?.text ?? '';
  return parseOutput(raw);
}

function parseOutput(raw: string): ClaudeRecommendationOutput {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in Claude response');
  try {
    const parsed = JSON.parse(match[0]) as Partial<ClaudeRecommendationOutput>;
    const sanitise = (arr: unknown): ClaudeRecommendationOutput['music'] =>
      Array.isArray(arr)
        ? (arr as { title: unknown; description: unknown; tag: unknown }[])
            .slice(0, 3)
            .map((item) => ({
              title:       String(item.title ?? '').slice(0, 120),
              description: String(item.description ?? '').slice(0, 300),
              tag:         String(item.tag ?? '').slice(0, 40),
            }))
        : [];

    return {
      element: parsed.element ?? 'Wood',
      music:  sanitise(parsed.music),
      books:  sanitise(parsed.books),
      travel: sanitise(parsed.travel),
    };
  } catch {
    throw new Error('Failed to parse Claude JSON output');
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // Auth
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return errorResponse('Rate limit exceeded. Try again in a minute.', 429);
  }

  // Parse & validate
  let request: ContentRecommendationRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // Cache lookup
  const cacheKey = `${request.dayStem}-${request.frame}`;
  const cached = getCached(cacheKey);
  if (cached) {
    const response: ContentRecommendationResponse = { ok: true, ...cached };
    return jsonResponse(response);
  }

  // Call Claude (fallback to static data on error)
  let result: ClaudeRecommendationOutput;
  try {
    const systemPrompt = buildSystemPrompt(request.frame);
    const userPrompt   = buildUserPrompt(request);
    result = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[content-recommendation] Claude error, using fallback:', e);
    const dominant = getDominantElement(request.elementBalance);
    result = FALLBACK[dominant];
  }

  setCached(cacheKey, result);

  const response: ContentRecommendationResponse = { ok: true, ...result };
  return jsonResponse(response);
});
