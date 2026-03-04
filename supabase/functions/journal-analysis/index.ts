/**
 * Supabase Edge Function: journal-analysis
 * Deno runtime
 *
 * POST /functions/v1/journal-analysis
 * Authorization: Bearer <user access token>
 *
 * Analyzes life events against saju elemental cycles using Claude AI.
 * Requires >= 5 events. Results cached 7 days (invalidated on new event add).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompts.ts';
import type {
  JournalAnalysisRequest,
  JournalAnalysisResponse,
  PatternInsight,
  CulturalFrame,
} from './types.ts';

// ── In-memory cache (keyed: userId, TTL 7 days) ───────────────────────────────

interface CacheEntry { data: JournalAnalysisResponse; expiresAt: number; }
const cache = new Map<string, CacheEntry>();

function getCached(key: string): JournalAnalysisResponse | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: JournalAnalysisResponse): void {
  cache.set(key, { data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
}

// ── Claude call ───────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<{ summary: string; patterns: PatternInsight[]; dominantElement: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}`);

  const json = await res.json() as { content: { type: string; text: string }[] };
  const text = json.content.find((c) => c.type === 'text')?.text ?? '{}';

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Claude response');

  return JSON.parse(match[0]) as {
    summary: string;
    patterns: PatternInsight[];
    dominantElement: string;
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_FRAMES = new Set<CulturalFrame>(['kr', 'cn', 'jp', 'en', 'es', 'in']);
const MIN_EVENTS = 5;

function validateRequest(body: unknown): JournalAnalysisRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.events)) throw new Error('Missing events array');
  if (b.events.length < MIN_EVENTS) throw new Error(`Need at least ${MIN_EVENTS} events`);
  if (!b.chart || typeof b.chart !== 'object') throw new Error('Missing chart');
  if (!VALID_FRAMES.has(b.frame as CulturalFrame)) throw new Error('Invalid frame');
  return b as unknown as JournalAnalysisRequest;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')      ?? '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // ── Parse & validate ───────────────────────────────────────────────────────
  let request: JournalAnalysisRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // ── Cache check (keyed by userId + eventCount for invalidation) ───────────
  const cacheKey = `${user.id}:${request.events.length}`;
  const cached = getCached(cacheKey);
  if (cached) return jsonResponse(cached);

  // ── Call Claude ────────────────────────────────────────────────────────────
  let claudeResult: { summary: string; patterns: PatternInsight[]; dominantElement: string };
  try {
    claudeResult = await callClaude(
      buildSystemPrompt(request.frame, (request as { userLanguage?: string }).userLanguage),
      buildUserPrompt(request.events, request.chart),
      ANTHROPIC_API_KEY,
    );
  } catch (e) {
    console.error('[journal-analysis] Claude error:', e);
    return errorResponse('Failed to get AI response', 502);
  }

  // ── Build response ─────────────────────────────────────────────────────────
  const response: JournalAnalysisResponse = {
    ok:              true,
    summary:         claudeResult.summary ?? '',
    patterns:        claudeResult.patterns ?? [],
    dominantElement: claudeResult.dominantElement ?? 'Unknown',
    eventCount:      request.events.length,
    cachedAt:        new Date().toISOString(),
  };

  setCached(cacheKey, response);

  return jsonResponse(response);
});
