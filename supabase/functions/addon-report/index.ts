/**
 * Supabase Edge Function: addon-report
 * Deno runtime
 *
 * POST /functions/v1/addon-report
 * Authorization: Bearer <user access token>
 *
 * Generates one of 4 paid add-on reports using Claude API.
 * Reports are permanently cached in DB per (userId, reportType, periodKey).
 *   - career:        annual  → expires Jan 1 next year
 *   - daewoon_full:  per 대운 → expires on daewoon period end (startYear + 10)
 *   - compatibility: monthly → expires on next month 1st
 *   - name_analysis: monthly+name → expires on next month 1st
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

// ── Cache key + expiry computation ────────────────────────────────────────────

function computePeriodKey(
  req: AddonReportRequest,
  today: Date,
  lang: string,
): { periodKey: string; expiresAt: Date } {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  const nextMonthStart = m === 12
    ? new Date(Date.UTC(y + 1, 0, 1))
    : new Date(Date.UTC(y, m, 1));
  const nextYearStart = new Date(Date.UTC(y + 1, 0, 1));

  switch (req.reportType) {
    case 'career':
      return { periodKey: `${y}:${lang}`, expiresAt: nextYearStart };

    case 'daewoon_full': {
      const chart = req.chart as Record<string, unknown>;
      const daewoonList = Array.isArray(chart.daewoonList) ? chart.daewoonList : [];
      const birthYear = (req as unknown as Record<string, unknown>).birthYear as number ?? y;
      const active = daewoonList.find((d: Record<string, unknown>) => {
        const startYear = birthYear + (d.startAge as number ?? 0);
        return startYear <= y && y < startYear + 10;
      });
      const dwStartYear = active
        ? birthYear + (active.startAge as number ?? 0)
        : y;
      return { periodKey: `${dwStartYear}:${lang}`, expiresAt: new Date(Date.UTC(dwStartYear + 10, 0, 1)) };
    }

    case 'compatibility':
      return { periodKey: `${ym}:${lang}`, expiresAt: nextMonthStart };

    case 'name_analysis': {
      const safeName = (req.name ?? '').toLowerCase().replace(/\s+/g, '').slice(0, 20);
      return { periodKey: `${ym}:${safeName}:${lang}`, expiresAt: nextMonthStart };
    }

    default:
      return { periodKey: `${ym}:${lang}`, expiresAt: nextMonthStart };
  }
}

// ── DB cache helpers ──────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function getCachedReport(
  adminClient: SupabaseClient,
  userId: string,
  reportType: string,
  periodKey: string,
): Promise<ClaudeReportOutput | null> {
  const { data, error } = await adminClient
    .from('report_cache')
    .select('report_data')
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .eq('period_key', periodKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error('[addon-report] cache read error:', error.message);
    return null;
  }
  return data?.report_data ?? null;
}

async function saveReportToCache(
  adminClient: SupabaseClient,
  userId: string,
  reportType: string,
  periodKey: string,
  reportData: ClaudeReportOutput,
  expiresAt: Date,
): Promise<void> {
  const { error } = await adminClient.from('report_cache').upsert(
    {
      user_id: userId,
      report_type: reportType,
      period_key: periodKey,
      report_data: reportData,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'user_id,report_type,period_key' },
  );
  if (error) {
    console.error('[addon-report] cache write error:', error.message);
  }
}

// ── Claude API call ───────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1500;

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeReportOutput> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
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
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) {
    return { title: '', overview: '', sections: [] };
  }
  try {
    const parsed = JSON.parse(match[0]) as Partial<ClaudeReportOutput>;
    return {
      title: String(parsed.title ?? '').slice(0, 100),
      overview: String(parsed.overview ?? '').slice(0, 500),
      sections: Array.isArray(parsed.sections)
        ? (parsed.sections as { heading: string; content: string }[])
            .slice(0, 2)
            .map((s) => ({
              heading: String(s.heading ?? '').slice(0, 100),
              content: String(s.content ?? ''),
            }))
        : [],
    };
  } catch {
    return { title: '', overview: '', sections: [] };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const SUPABASE_URL           = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const SUPABASE_SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY      = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

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

  // Admin client for cache operations (bypasses RLS)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Compute cache key
  const today = new Date();
  const userLanguage = (request as unknown as Record<string, unknown>).userLanguage as string | undefined;
  const { periodKey, expiresAt } = computePeriodKey(request, today, userLanguage ?? 'ko');

  // ── Cache hit → return immediately, no Claude call ────────────────────────
  const cached = await getCachedReport(adminClient, user.id, request.reportType, periodKey);
  if (cached) {
    console.log(`[addon-report] cache hit: ${user.id} ${request.reportType} ${periodKey}`);
    const response: AddonReportResponse = { ok: true, report: cached };
    return jsonResponse(response);
  }

  // ── Cache miss → call Claude ──────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(request.frame, userLanguage);
  const userPrompt   = buildUserPrompt(request);

  let report: ClaudeReportOutput;
  try {
    report = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (e) {
    console.error('[addon-report] Claude error:', e);
    return errorResponse('AI report generation failed. Please try again.', 502);
  }

  // Save to DB cache (fire-and-forget, don't block response)
  saveReportToCache(adminClient, user.id, request.reportType, periodKey, report, expiresAt)
    .catch((e: unknown) => console.error('[addon-report] cache save error:', e));

  const response: AddonReportResponse = { ok: true, report };
  return jsonResponse(response);
});
