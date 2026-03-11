/**
 * Supabase Edge Function: relationship-fortune
 * Deno runtime
 *
 * POST /functions/v1/relationship-fortune
 * Authorization: Bearer <user access token>
 *
 * Computes compatibility score + monthly fortune for a saved relationship.
 * Results are cached in the relationships table for 24 hours.
 * Requires premium OR deep_compatibility addon entitlement.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  computeCompatibilityScore,
} from './prompts.ts';
import type {
  RelationshipFortuneRequest,
  RelationshipFortuneResponse,
  CompatibilityStatus,
  CulturalFrame,
} from './types.ts';

// ── In-memory cache (keyed: userId+relationshipId+refMonth) ──────────────────

interface CacheEntry { data: RelationshipFortuneResponse; expiresAt: number; }
const cache = new Map<string, CacheEntry>();

function getCached(key: string): RelationshipFortuneResponse | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: RelationshipFortuneResponse): void {
  cache.set(key, { data, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
}

// ── Simple partner element balance estimator ──────────────────────────────────
// Lightweight approximation: derive from birth year sexagenary cycle.
// In production this would use the full saju-engine via tRPC.

const STEM_ELEMENT: Record<string, string> = {
  甲: 'Wood', 乙: 'Wood', 丙: 'Fire', 丁: 'Fire',
  戊: 'Earth', 己: 'Earth', 庚: 'Metal', 辛: 'Metal',
  壬: 'Water', 癸: 'Water',
};
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;

function estimatePartnerBalance(birth: {
  year: number; month: number; day: number; hour?: number;
}): Record<string, number> {
  const balance: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  // Year stem
  const yearStem = STEMS[(birth.year - 4) % 10];
  const yearElem = STEM_ELEMENT[yearStem];
  if (yearElem) balance[yearElem]++;

  // Month stem (simplified: cycle from year stem)
  const monthStemIdx = ((birth.year - 4) % 10 + birth.month) % 10;
  const monthElem = STEM_ELEMENT[STEMS[monthStemIdx]!];
  if (monthElem) balance[monthElem]++;

  // Day stem (rough estimate based on day number)
  const dayStemIdx = (birth.day + birth.month * 2 + birth.year) % 10;
  const dayElem = STEM_ELEMENT[STEMS[dayStemIdx]!];
  if (dayElem) balance[dayElem]++;

  // Hour stem (if known)
  if (birth.hour != null) {
    const hourStemIdx = (birth.hour + birth.day) % 10;
    const hourElem = STEM_ELEMENT[STEMS[hourStemIdx]!];
    if (hourElem) balance[hourElem]++;
  }

  return balance;
}

// ── Status from score ─────────────────────────────────────────────────────────

function scoreToStatus(score: number): CompatibilityStatus {
  if (score >= 70) return 'good';
  if (score >= 40) return 'neutral';
  return 'caution';
}

// ── Claude call ───────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 500;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<{ summary: string; monthlyFlow: string; strengths: string[]; cautions: string[] }> {
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

  const json = await res.json() as {
    content: { type: string; text: string }[];
  };

  const text = json.content.find((c) => c.type === 'text')?.text ?? '{}';

  // Extract JSON block (Claude may wrap in markdown)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Claude response');

  return JSON.parse(match[0]) as {
    summary: string; monthlyFlow: string; strengths: string[]; cautions: string[];
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_FRAMES = new Set<CulturalFrame>(['kr','cn','jp','en','es','in']);

function validateRequest(body: unknown): RelationshipFortuneRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (typeof b.relationshipId !== 'string') throw new Error('Missing relationshipId');
  if (!b.ownerChart || typeof b.ownerChart !== 'object') throw new Error('Missing ownerChart');
  if (!b.partnerBirth || typeof b.partnerBirth !== 'object') throw new Error('Missing partnerBirth');
  if (typeof b.partnerName !== 'string') throw new Error('Missing partnerName');
  if (!VALID_FRAMES.has(b.frame as CulturalFrame)) throw new Error('Invalid frame');
  if (typeof b.refMonth !== 'string') throw new Error('Missing refMonth');
  return b as unknown as RelationshipFortuneRequest;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')              ?? '';
  const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY         = Deno.env.get('ANTHROPIC_API_KEY')         ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // ── Premium / addon gate ───────────────────────────────────────────────────
  const meta = user.user_metadata ?? {};
  const hasAccess = meta.is_premium === true || meta.has_deep_compatibility === true;
  if (!hasAccess) {
    return jsonResponse({ ok: false, error: 'premium_required' }, 403);
  }

  // ── Parse & validate ───────────────────────────────────────────────────────
  let request: RelationshipFortuneRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // ── Cache check ────────────────────────────────────────────────────────────
  const userLanguage = (request as unknown as Record<string, unknown>).userLanguage as string | undefined;
  const cacheKey = `${user.id}:${request.relationshipId}:${request.refMonth}:${userLanguage ?? 'ko'}`;
  const cached = getCached(cacheKey);
  if (cached) return jsonResponse(cached);

  // ── Compute element balance for partner ───────────────────────────────────
  const partnerBalance = estimatePartnerBalance(request.partnerBirth);

  // ── Compute compatibility score ────────────────────────────────────────────
  const score = computeCompatibilityScore(request.ownerChart, partnerBalance);
  const status = scoreToStatus(score);

  // ── Build element synergy map (combined) ──────────────────────────────────
  const ownerBal = request.ownerChart.elementBalance as Record<string, number>;
  const elementSynergy: Record<string, number> = {};
  for (const elem of ['Wood', 'Fire', 'Earth', 'Metal', 'Water']) {
    elementSynergy[elem] = (ownerBal[elem] ?? 0) + (partnerBalance[elem] ?? 0);
  }

  // ── Call Claude ────────────────────────────────────────────────────────────
  let claudeResult: { summary: string; monthlyFlow: string; strengths: string[]; cautions: string[] };
  try {
    const systemPrompt = buildSystemPrompt(request.frame, userLanguage);
    const userPrompt = buildUserPrompt(
      request.ownerChart,
      request.partnerBirth,
      request.partnerName,
      request.relationshipType,
      request.refMonth,
      score,
    );
    claudeResult = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[relationship-fortune] Claude error:', e);
    return errorResponse('Failed to get AI response', 502);
  }

  // ── Build response ─────────────────────────────────────────────────────────
  const response: RelationshipFortuneResponse = {
    ok: true,
    compatibilityScore: score,
    compatibilityStatus: status,
    summary:     claudeResult.summary,
    monthlyFlow: claudeResult.monthlyFlow,
    strengths:   claudeResult.strengths ?? [],
    cautions:    claudeResult.cautions  ?? [],
    elementSynergy,
  };

  // ── Cache response ─────────────────────────────────────────────────────────
  setCached(cacheKey, response);

  // ── Persist score to DB (background) ──────────────────────────────────────
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    admin
      .from('relationships')
      .update({
        compatibility_score: score,
        compatibility_status: status,
        compatibility_cached_at: new Date().toISOString(),
      })
      .eq('id', request.relationshipId)
      .eq('owner_id', user.id)
      .then(({ error }) => {
        if (error) console.error('[relationship-fortune] DB update error:', error);
      });
  }

  return jsonResponse(response);
});
