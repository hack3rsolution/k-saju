/**
 * Supabase Edge Function: content-recommendation
 * Deno runtime
 *
 * POST /functions/v1/content-recommendation
 * Authorization: Bearer <user access token>
 *
 * Streams music / book / travel recommendations as SSE events.
 * 3 parallel Claude calls (400 tokens each), emitted as each resolves.
 * Cache hit: all 3 categories emitted instantly from in-memory cache.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, corsResponse, errorResponse } from '../_shared/cors.ts';
import { stripCodeFences, CLAUDE_MODEL } from '../_shared/claude.ts';
import {
  buildSystemPrompt,
  buildCategoryUserPrompt,
  getDominantElement,
} from './prompts.ts';
import type {
  ContentRecommendationRequest,
  ClaudeRecommendationOutput,
  RecommendationItem,
  FiveElement,
  CulturalFrame,
} from './types.ts';

// ── In-memory cache (24 h TTL) ────────────────────────────────────────────────

interface CacheEntry { data: ClaudeRecommendationOutput; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(key: string): ClaudeRecommendationOutput | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) { cache.delete(key); return null; }
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

// ── Per-category Claude call ──────────────────────────────────────────────────

type Category = 'music' | 'books' | 'travel';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = CLAUDE_MODEL;
const MAX_TOKENS_PER_CATEGORY = 400;

function sanitiseItems(arr: unknown): RecommendationItem[] {
  if (!Array.isArray(arr)) return [];
  return (arr as { title?: unknown; description?: unknown; tag?: unknown }[])
    .slice(0, 3)
    .map((item) => ({
      title:       String(item.title       ?? '').slice(0, 120),
      description: String(item.description ?? '').slice(0, 300),
      tag:         String(item.tag         ?? '').slice(0,  40),
    }));
}

async function callClaudeForCategory(
  category: Category,
  req: ContentRecommendationRequest,
  dominant: string,
  systemPrompt: string,
  apiKey: string,
): Promise<RecommendationItem[]> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS_PER_CATEGORY,
      system: systemPrompt,
      messages: [{ role: 'user', content: buildCategoryUserPrompt(req, category, dominant) }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const raw = data.content?.[0]?.text ?? '';
  const stripped = stripCodeFences(raw);
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in ${category} response`);
  const parsed = JSON.parse(match[0]) as { items?: unknown[] };
  return sanitiseItems(parsed.items ?? []);
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseDone(): Uint8Array {
  return encoder.encode('data: [DONE]\n\n');
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')      ?? '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // Auth
  const authHeader = req.headers.get('Authorization') ?? '';
  const authToken  = authHeader.replace('Bearer ', '').trim();
  const supabase   = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  let userId: string;
  if (SUPABASE_ANON_KEY && authToken === SUPABASE_ANON_KEY) {
    userId = '00000000-0000-4000-8000-000000000000';
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);
    userId = user.id;
  }

  if (!checkRateLimit(userId)) return errorResponse('Rate limit exceeded.', 429);

  let request: ContentRecommendationRequest;
  try {
    request = validateRequest(await req.json());
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  const cacheKey    = `${request.dayStem}-${request.frame}-${request.userLanguage ?? 'en'}`;
  const dominant    = getDominantElement(request.elementBalance);
  const systemPrompt = buildSystemPrompt(request.frame, request.userLanguage);

  // Always respond with SSE so the client uses the same code path for cached and fresh data
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sseEvent(data));

      // ── Cache hit: emit all events immediately ──────────────────────────────
      const cached = getCached(cacheKey);
      if (cached) {
        send({ type: 'music',  element: cached.element, items: cached.music  });
        send({ type: 'books',  element: cached.element, items: cached.books  });
        send({ type: 'travel', element: cached.element, items: cached.travel });
        send({ type: 'done',   element: cached.element });
        controller.enqueue(sseDone());
        controller.close();
        return;
      }

      // ── Cache miss: 3 parallel Claude calls, emit each as it resolves ──────
      const results: Partial<Record<Category, RecommendationItem[]>> = {};

      try {
        const categories: Category[] = ['music', 'books', 'travel'];
        await Promise.all(
          categories.map(async (cat) => {
            const items = await callClaudeForCategory(cat, request, dominant, systemPrompt, ANTHROPIC_API_KEY);
            results[cat] = items;
            send({ type: cat, element: dominant, items });
          }),
        );

        const full: ClaudeRecommendationOutput = {
          element: dominant as FiveElement,
          music:  results.music  ?? [],
          books:  results.books  ?? [],
          travel: results.travel ?? [],
        };
        setCached(cacheKey, full);
        send({ type: 'done', element: dominant });
      } catch (e) {
        console.error('[content-recommendation] stream error:', e);
        send({ type: 'error', message: 'Recommendation service unavailable.' });
      }

      controller.enqueue(sseDone());
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
});
