/**
 * Supabase Edge Function: addon-report
 * Deno runtime
 *
 * POST /functions/v1/addon-report
 * Authorization: Bearer <user access token>
 *
 * Generates one of 4 paid add-on reports using Claude API.
 * No server-side caching — each call generates a fresh report.
 * Entitlement verification is enforced client-side via RevenueCat;
 * the Edge Function trusts the authenticated user.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompts.ts';
import type {
  AddonReportRequest,
  AddonReportResponse,
  AddonReportType,
  CulturalFrame,
  ClaudeReportOutput,
} from './types.ts';

// ── Rate limit (per instance) ─────────────────────────────────────────────────

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

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_REPORT_TYPES = new Set<AddonReportType>([
  'compatibility', 'career', 'daewoon_full', 'name_analysis',
]);
const VALID_FRAMES = new Set<CulturalFrame>([
  'kr', 'cn', 'jp', 'en', 'es', 'in',
]);

function validateRequest(body: unknown): AddonReportRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  if (!VALID_REPORT_TYPES.has(b.reportType as AddonReportType))
    throw new Error('Invalid reportType');
  if (!VALID_FRAMES.has(b.frame as CulturalFrame))
    throw new Error('Invalid frame');
  if (!b.chart || typeof b.chart !== 'object')
    throw new Error('Missing chart');
  if (b.reportType === 'name_analysis' && !b.name)
    throw new Error('Missing name for name_analysis');
  return b as unknown as AddonReportRequest;
}

// ── Claude API call ───────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeReportOutput> {
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

function parseOutput(raw: string): ClaudeReportOutput {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      title: 'Report',
      overview: raw.slice(0, 200).trim(),
      sections: [{ heading: 'Analysis', content: raw.trim() }],
    };
  }
  try {
    const parsed = JSON.parse(match[0]) as Partial<ClaudeReportOutput>;
    return {
      title: String(parsed.title ?? 'Report').slice(0, 100),
      overview: String(parsed.overview ?? '').slice(0, 500),
      sections: Array.isArray(parsed.sections)
        ? (parsed.sections as { heading: string; content: string }[])
            .slice(0, 8)
            .map((s) => ({
              heading: String(s.heading ?? '').slice(0, 100),
              content: String(s.content ?? ''),
            }))
        : [],
    };
  } catch {
    return {
      title: 'Report',
      overview: raw.slice(0, 200).trim(),
      sections: [{ heading: 'Analysis', content: raw.trim() }],
    };
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
  let request: AddonReportRequest;
  try {
    const body = await req.json();
    request = validateRequest(body);
  } catch (e) {
    return errorResponse((e as Error).message);
  }

  // Build prompts & call Claude
  const systemPrompt = buildSystemPrompt(request.frame);
  const userPrompt   = buildUserPrompt(request);

  let report: ClaudeReportOutput;
  try {
    report = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[addon-report] Claude error:', e);
    return errorResponse('AI report generation failed. Please try again.', 502);
  }

  const response: AddonReportResponse = { ok: true, report };
  return jsonResponse(response);
});
