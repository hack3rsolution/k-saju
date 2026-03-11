/**
 * Supabase Edge Function: k-personality-analysis
 * Deno runtime — no Node.js APIs
 *
 * POST /functions/v1/k-personality-analysis
 * Authorization: Bearer <supabase_anon_key>
 *
 * Body: KPersonalityRequest (see types below)
 * Response: KPersonalityFreeResult | KPersonalityPremiumResult + { cached: boolean }
 *
 * 캐시 전략: k_personality_readings 테이블 (user_id + language + is_premium)
 *            TTL 7일 — 오행 성격은 생년월일 기반으로 변하지 않으므로 장기 캐싱.
 *            테이블 미존재 시 try-catch로 무시하고 Claude API 직접 호출.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildLangInstruction, LANGUAGE_NAMES } from '../_shared/claude.ts';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL             = 'claude-haiku-4-5-20251001';
const MAX_TOKENS        = 1500;  // premium 심층 분석 포함 충분한 여유
const CACHE_TTL_HOURS   = 24 * 7; // 7일

// ── Local types (mirrors apps/mobile/src/types/kPersonality.ts) ───────────────

type KElement   = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type SasangType = 'taeyang' | 'soyang' | 'taeeum' | 'soeum';

interface FiveElementRatio {
  wood: number; fire: number; earth: number; metal: number; water: number;
}

interface KPersonalityRequest {
  elementRatio:    FiveElementRatio;
  sasangType:      SasangType;
  dominantElement: KElement;
  weakestElement:  KElement;
  language:        string;   // BCP-47 코드 (en, ko, zh-Hans …)
  isPremium:       boolean;
  userId:          string;
}

interface KPersonalityFreeResult {
  typeName:     string;
  typeNameKo:   string;
  keywords:     string[];  // 3개
  summaryShort: string;    // ≤ 120자
}

interface KPersonalityPremiumResult extends KPersonalityFreeResult {
  summaryFull:       string;
  strengths:         string[];     // 3개
  growthAreas:       string[];     // 2개
  careerFit:         string[];     // 5개
  compatibleTypes:   SasangType[]; // 2개
  monthlyEnergyFlow: string;
}

// ── 사상체질 표시명 (프롬프트용) ─────────────────────────────────────────────

const SASANG_NAMES: Record<SasangType, { ko: string; en: string }> = {
  taeyang: { ko: '태양인', en: 'Taeyang' },
  soyang:  { ko: '소양인', en: 'Soyang'  },
  taeeum:  { ko: '태음인', en: 'Taeeum'  },
  soeum:   { ko: '소음인', en: 'Soeum'   },
};

// ── 캐시 헬퍼 ────────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createClient>;

async function getCachedResult(
  supabase: AdminClient,
  userId: string,
  language: string,
  isPremium: boolean,
): Promise<(KPersonalityFreeResult | KPersonalityPremiumResult) | null> {
  try {
    const { data, error } = await supabase
      .from('k_personality_readings')
      .select('type_name, type_name_ko, keywords, summary_short, summary_full, strengths, growth_areas, career_fit, compatible_types, monthly_energy_flow')
      .eq('user_id', userId)
      .eq('language', language)
      .eq('is_premium', isPremium)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const row = data as Record<string, unknown>;
    const base: KPersonalityFreeResult = {
      typeName:     String(row.type_name     ?? ''),
      typeNameKo:   String(row.type_name_ko  ?? ''),
      keywords:     Array.isArray(row.keywords) ? row.keywords as string[] : [],
      summaryShort: String(row.summary_short ?? ''),
    };

    if (isPremium && row.summary_full) {
      return {
        ...base,
        summaryFull:       String(row.summary_full        ?? ''),
        strengths:         Array.isArray(row.strengths)          ? row.strengths          as string[]     : [],
        growthAreas:       Array.isArray(row.growth_areas)       ? row.growth_areas       as string[]     : [],
        careerFit:         Array.isArray(row.career_fit)         ? row.career_fit         as string[]     : [],
        compatibleTypes:   Array.isArray(row.compatible_types)   ? row.compatible_types   as SasangType[] : [],
        monthlyEnergyFlow: String(row.monthly_energy_flow ?? ''),
      };
    }

    return base;
  } catch {
    // 테이블 미존재 또는 DB 에러 — 비치명적, API 호출로 fallback
    return null;
  }
}

async function storeResult(
  supabase: AdminClient,
  userId: string,
  language: string,
  isPremium: boolean,
  elementRatio: FiveElementRatio,
  sasangType: SasangType,
  result: KPersonalityFreeResult | KPersonalityPremiumResult,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3_600_000).toISOString();
    const p = result as KPersonalityPremiumResult;

    await supabase.from('k_personality_readings').upsert(
      {
        user_id:             userId,
        language,
        is_premium:          isPremium,
        element_ratio:       elementRatio,
        sasang_type:         sasangType,
        type_name:           result.typeName,
        type_name_ko:        result.typeNameKo,
        keywords:            result.keywords,
        summary_short:       result.summaryShort,
        summary_full:        p.summaryFull        ?? null,
        strengths:           p.strengths          ?? null,
        growth_areas:        p.growthAreas        ?? null,
        career_fit:          p.careerFit          ?? null,
        compatible_types:    p.compatibleTypes    ?? null,
        monthly_energy_flow: p.monthlyEnergyFlow  ?? null,
        expires_at:          expiresAt,
      },
      { onConflict: 'user_id,language,is_premium' },
    );
  } catch {
    // 캐시 저장 실패는 비치명적 — 결과는 정상 반환
  }
}

// ── Claude API 호출 ──────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key':          apiKey,
      'anthropic-version':  '2023-06-01',
      'content-type':       'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text ?? '';
}

// ── JSON 파싱 ────────────────────────────────────────────────────────────────

function parseResult(
  raw: string,
  isPremium: boolean,
): KPersonalityFreeResult | KPersonalityPremiumResult {
  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in Claude response');

  const p = JSON.parse(match[0]) as Record<string, unknown>;

  const base: KPersonalityFreeResult = {
    typeName:     String(p.typeName     ?? '').trim(),
    typeNameKo:   String(p.typeNameKo   ?? '').trim(),
    keywords:     Array.isArray(p.keywords) ? (p.keywords as string[]).slice(0, 3) : [],
    summaryShort: String(p.summaryShort ?? '').slice(0, 150).trim(),
  };

  if (!isPremium) return base;

  return {
    ...base,
    summaryFull:       String(p.summaryFull       ?? '').trim(),
    strengths:         Array.isArray(p.strengths)        ? (p.strengths        as string[]).slice(0, 3)     : [],
    growthAreas:       Array.isArray(p.growthAreas)      ? (p.growthAreas      as string[]).slice(0, 2)     : [],
    careerFit:         Array.isArray(p.careerFit)        ? (p.careerFit        as string[]).slice(0, 5)     : [],
    compatibleTypes:   Array.isArray(p.compatibleTypes)  ? (p.compatibleTypes  as SasangType[]).slice(0, 2) : [],
    monthlyEnergyFlow: String(p.monthlyEnergyFlow ?? '').trim(),
  };
}

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildPrompts(
  elementRatio: FiveElementRatio,
  sasangType: SasangType,
  dominantElement: KElement,
  weakestElement: KElement,
  language: string,
  isPremium: boolean,
): { systemPrompt: string; userPrompt: string } {
  const langName   = LANGUAGE_NAMES[language] ?? language;
  const sasangInfo = SASANG_NAMES[sasangType];

  const systemPrompt =
    buildLangInstruction(language) +
    `You are an expert in Korean traditional philosophy, specializing in the ` +
    `Five Elements (오행/Ohaeng) and Sasang Constitutional Medicine (사상체질). ` +
    `Analyze personality based on birth energy patterns. ` +
    `Respond ONLY in ${langName}. ` +
    `Be warm, insightful, culturally authentic, and globally accessible. ` +
    `Frame insights as personality strengths, not fortune-telling. ` +
    `Return ONLY valid JSON. No markdown, no preamble, no explanation.`;

  const freePrompt =
    `Analyze this person's K-Type personality:\n\n` +
    `Five Elements:\n` +
    `木 Wood ${elementRatio.wood}% | 火 Fire ${elementRatio.fire}% | 土 Earth ${elementRatio.earth}%\n` +
    `金 Metal ${elementRatio.metal}% | 水 Water ${elementRatio.water}%\n\n` +
    `Dominant: ${dominantElement} | Sasang: ${sasangType} (${sasangInfo.en}/${sasangInfo.ko})\n` +
    `Needs balance: ${weakestElement}\n\n` +
    `Return JSON only:\n` +
    `{\n` +
    `  "typeName": "2-3 word English archetype (e.g. Visionary Pioneer)",\n` +
    `  "typeNameKo": "한국어 유형명 2-3단어",\n` +
    `  "keywords": ["keyword1", "keyword2", "keyword3"],\n` +
    `  "summaryShort": "120자 이내 핵심 성격 (${langName}로 작성)"\n` +
    `}`;

  const premiumAddendum = !isPremium ? '' :
    `\n\nAlso provide deeper analysis. Add these fields to your JSON:\n` +
    `  "summaryFull": "500-800자 심층 분석 (${langName}로)",\n` +
    `  "strengths": ["강점1", "강점2", "강점3"],\n` +
    `  "growthAreas": ["성장영역1", "성장영역2"],\n` +
    `  "careerFit": ["직군1", "직군2", "직군3", "직군4", "직군5"],\n` +
    `  "compatibleTypes": ["sasangType1", "sasangType2"],\n` +
    `  "monthlyEnergyFlow": "이번 달 오행 에너지 200자 (${langName}로)"`;

  return { systemPrompt, userPrompt: freePrompt + premiumAddendum };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST')   return errorResponse('Method not allowed', 405);

  // ── 환경변수 ─────────────────────────────────────────────────────────────
  const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')              ?? '';
  const SUPABASE_ANON_KEY    = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')         ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // ── 인증 — saju-reading과 동일한 패턴 ───────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  let userId: string;
  if (authError || !user) {
    // anon key Bearer → guest 유저 (saju-reading과 동일한 허용 패턴)
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token === SUPABASE_ANON_KEY) {
      userId = '00000000-0000-4000-8000-000000000000';
    } else {
      return errorResponse('Unauthorized', 401);
    }
  } else {
    userId = user.id;
  }

  // ── 요청 파싱 ────────────────────────────────────────────────────────────
  let body: KPersonalityRequest;
  try {
    body = await req.json() as KPersonalityRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const {
    elementRatio,
    sasangType,
    dominantElement,
    weakestElement,
    language   = 'en',
    isPremium  = false,
  } = body;

  if (!elementRatio || !sasangType || !dominantElement || !weakestElement) {
    return errorResponse('Missing required fields: elementRatio, sasangType, dominantElement, weakestElement', 400);
  }

  // ── 캐시 조회 ────────────────────────────────────────────────────────────
  const cached = await getCachedResult(supabaseAdmin, userId, language, isPremium);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  // ── Claude API 호출 ──────────────────────────────────────────────────────
  const { systemPrompt, userPrompt } = buildPrompts(
    elementRatio, sasangType, dominantElement, weakestElement, language, isPremium,
  );

  let rawResponse: string;
  try {
    rawResponse = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse(`Claude API error: ${msg}`, 502);
  }

  // ── 결과 파싱 ────────────────────────────────────────────────────────────
  let result: KPersonalityFreeResult | KPersonalityPremiumResult;
  try {
    result = parseResult(rawResponse, isPremium);
  } catch {
    return errorResponse('Failed to parse Claude response', 502);
  }

  // ── 캐시 저장 (비치명적) ─────────────────────────────────────────────────
  await storeResult(supabaseAdmin, userId, language, isPremium, elementRatio, sasangType, result);

  return jsonResponse({ ...result, cached: false });
});
