/**
 * Supabase Edge Function: fortune-chat
 * Deno runtime
 *
 * POST /functions/v1/fortune-chat
 * Authorization: Bearer <user access token>
 *
 * Receives a conversation history + saju chart + today's reading,
 * streams Claude's follow-up response as SSE tokens.
 * Premium users: 20 requests / day rate limit.
 * Free users: blocked (respond with 403 + paywall prompt).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, SUGGESTED_QUESTIONS } from './prompts.ts';
import type {
  FortuneChatRequest,
  CulturalFrame,
} from './types.ts';

// ── Daily rate limit (Premium: 20/day) ───────────────────────────────────────

interface RateLimitRecord { count: number; resetAt: number; }
const rateLimitMap = new Map<string, RateLimitRecord>();
const DAILY_LIMIT = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  const rec = rateLimitMap.get(userId) ?? { count: 0, resetAt };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = resetAt; }
  rec.count++;
  rateLimitMap.set(userId, rec);
  return rec.count <= DAILY_LIMIT;
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_FRAMES = new Set<CulturalFrame>(['kr', 'cn', 'jp', 'en', 'es', 'in']);

function validateRequest(body: unknown): FortuneChatRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (typeof b.fortuneId !== 'string') throw new Error('Missing fortuneId');
  if (!Array.isArray(b.messages) || b.messages.length === 0) throw new Error('Missing messages');
  if (!VALID_FRAMES.has(b.frame as CulturalFrame)) throw new Error('Invalid frame');
  if (!b.chart || typeof b.chart !== 'object') throw new Error('Missing chart');
  if (!b.todayReading || typeof b.todayReading !== 'object') throw new Error('Missing todayReading');
  return b as unknown as FortuneChatRequest;
}

// ── Streaming Claude call (SSE) ───────────────────────────────────────────────

const ANTHROPIC_STREAM_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 512;

async function streamClaudeResponse(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(ANTHROPIC_STREAM_URL, {
    method: 'POST',
    headers: {
      'x-api-key':          apiKey,
      'anthropic-version':  '2023-06-01',
      'content-type':       'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      stream:     true,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const reader = res.body!.getReader();
  const encoder = new TextEncoder();

  // Transform Anthropic SSE → our simplified SSE (data: {"token":"..."})
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const evt = JSON.parse(data) as {
                type: string;
                delta?: { type: string; text: string };
              };

              if (
                evt.type === 'content_block_delta' &&
                evt.delta?.type === 'text_delta' &&
                evt.delta.text
              ) {
                const token = JSON.stringify({ token: evt.delta.text });
                controller.enqueue(encoder.encode(`data: ${token}\n\n`));
              }
            } catch { /* skip malformed event */ }
          }
        }
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

// ── Persist messages to DB ────────────────────────────────────────────────────

async function persistMessages(
  supabaseAdminClient: ReturnType<typeof createClient>,
  userId: string,
  fortuneId: string,
  userContent: string,
  assistantContent: string,
): Promise<void> {
  await supabaseAdminClient.from('fortune_chat_history').insert([
    { user_id: userId, fortune_cache_id: fortuneId, role: 'user',      content: userContent },
    { user_id: userId, fortune_cache_id: fortuneId, role: 'assistant', content: assistantContent },
  ]);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')             ?? '';
  const SUPABASE_ANON_KEY        = Deno.env.get('SUPABASE_ANON_KEY')        ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY        = Deno.env.get('ANTHROPIC_API_KEY')        ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // ── Freemium / Premium gate ───────────────────────────────────────────────
  const isPremium = user.user_metadata?.is_premium === true;
  if (!isPremium) {
    // Free users: 1 chat per calendar day — verified server-side
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { count } = await supabaseAdmin
      .from('fortune_chat_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString());

    if ((count ?? 0) >= 1) {
      return jsonResponse({
        ok:    false,
        error: 'free_limit_reached',
        suggestedQuestions: SUGGESTED_QUESTIONS['en'],
      }, 402);
    }
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (!checkRateLimit(user.id)) {
    return errorResponse('Daily limit of 20 chat messages reached. Try again tomorrow.', 429);
  }

  // ── Parse & validate ──────────────────────────────────────────────────────
  let request: FortuneChatRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // ── Build Claude messages ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(request.frame, request.chart, request.todayReading, (request as { userLanguage?: string }).userLanguage);
  const claudeMessages = request.messages.map((m) => ({
    role:    m.role,
    content: m.content,
  }));

  // ── Stream Claude response ────────────────────────────────────────────────
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await streamClaudeResponse(systemPrompt, claudeMessages, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[fortune-chat] Claude error:', e);
    return errorResponse('Failed to get AI response. Please try again.', 502);
  }

  // ── Persist to DB in background ───────────────────────────────────────────
  // We collect the full assistant reply via a TransformStream, then persist it.
  const userContent = request.messages[request.messages.length - 1]?.content ?? '';
  let assistantAccumulated = '';

  const persistTransform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      const text = new TextDecoder().decode(chunk);
      // Extract token text from SSE lines
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try {
          const parsed = JSON.parse(line.slice(6)) as { token?: string };
          if (parsed.token) assistantAccumulated += parsed.token;
        } catch { /* ignore */ }
      }
    },
    async flush() {
      // Persist both user message and assistant reply after stream ends
      if (SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        persistMessages(adminClient, user.id, request.fortuneId, userContent, assistantAccumulated)
          .catch((e) => console.error('[fortune-chat] persist error:', e));
      }
    },
  });

  const finalStream = stream.pipeThrough(persistTransform);

  return new Response(finalStream, {
    headers: {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'Connection':                  'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
});
