/**
 * Supabase Edge Function: daily-routine
 * Deno runtime — no Node.js APIs
 *
 * POST /functions/v1/daily-routine
 * Authorization: Bearer <supabase_anon_key>
 *
 * Body: DailyRoutineRequest
 * Response: DailyRoutineResponse + { cached: boolean }
 *
 * 오행 지배력 계산 → Claude API → 음식/색상/활동/명상 텍스트 반환
 * 캐시 전략: daily_routine_cache (user_id + date + language), 일별 갱신
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildLangInstruction, LANGUAGE_NAMES } from '../_shared/claude.ts';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL             = 'claude-haiku-4-5-20251001';
const MAX_TOKENS        = 1200;

// ── Types ────────────────────────────────────────────────────────────────────

type FiveElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

interface SajuData {
  day_stem:    string;   // 일간 (天干)
  day_branch:  string;   // 일지 (地支)
  month_branch: string;  // 월지 (地支)
  year_stem:   string;   // 세운 천간 (현재 年柱)
}

interface DailyRoutineRequest {
  user_id?:      string;
  saju_data:     SajuData;
  language?:     string;   // BCP-47 코드
  cultural_frame?: string;
}

interface FoodItem     { name: string; emoji: string; reason: string; color_match: boolean }
interface ColorItem    { hex: string; name: string; reason: string }
interface ActivityItem { title: string; duration: string; icon: string; timing: string; reason: string }

interface RoutineContent {
  meditation_text: string;
  foods:           FoodItem[];
  colors:          ColorItem[];
  activities:      ActivityItem[];
}

interface DailyRoutineResponse extends RoutineContent {
  dominant_element: FiveElement;
  element_score:    Record<FiveElement, number>;
  date:             string;
  cached:           boolean;
}

// ── 천간/지지 → 오행 매핑 ───────────────────────────────────────────────────

const STEM_ELEMENT: Record<string, FiveElement> = {
  '甲': 'Wood', '乙': 'Wood',
  '丙': 'Fire', '丁': 'Fire',
  '戊': 'Earth','己': 'Earth',
  '庚': 'Metal','辛': 'Metal',
  '壬': 'Water','癸': 'Water',
};

const BRANCH_ELEMENT: Record<string, FiveElement> = {
  '子': 'Water', '丑': 'Earth', '寅': 'Wood',  '卯': 'Wood',
  '辰': 'Earth', '巳': 'Fire',  '午': 'Fire',  '未': 'Earth',
  '申': 'Metal', '酉': 'Metal', '戌': 'Earth', '亥': 'Water',
};

// ── 오행 점수 계산 ────────────────────────────────────────────────────────────

function calcElementScore(saju: SajuData): Record<FiveElement, number> {
  const score: Record<FiveElement, number> = {
    Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
  };

  const add = (el: FiveElement | undefined, weight: number) => {
    if (el) score[el] += weight;
  };

  add(STEM_ELEMENT[saju.day_stem],      2.0);  // 일간
  add(BRANCH_ELEMENT[saju.day_branch],  1.5);  // 일지
  add(BRANCH_ELEMENT[saju.month_branch],1.0);  // 월지
  add(STEM_ELEMENT[saju.year_stem],     0.8);  // 세운

  return score;
}

function dominantElement(score: Record<FiveElement, number>): FiveElement {
  return (Object.entries(score) as [FiveElement, number][])
    .reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ── Fallback 정적 데이터 (Claude API 실패 시) ─────────────────────────────────

const FALLBACK: Record<FiveElement, RoutineContent> = {
  Wood: {
    meditation_text: 'Growth unfolds in you today. Let your ideas reach like branches toward light.',
    foods: [
      { name: 'Broccoli', emoji: '🥦', reason: 'Wood energy supports liver health and renewal', color_match: true },
      { name: 'Avocado',  emoji: '🥑', reason: 'Green hue aligns with Wood element growth energy', color_match: true },
      { name: 'Edamame',  emoji: '🫛', reason: 'Fresh and vital, mirrors spring Wood vitality', color_match: false },
    ],
    colors: [
      { hex: '#228B22', name: 'Forest Green', reason: 'Wear or surround yourself with this to amplify Wood energy' },
      { hex: '#90EE90', name: 'Light Green',  reason: 'Soft green tones ease tension in the eyes and liver meridian' },
    ],
    activities: [
      { title: 'Full-body stretch', duration: '10 min', icon: '🧘', timing: '아침', reason: 'Wood rules flexibility and tendons — morning stretch awakens this energy' },
      { title: 'Reading or journaling', duration: '20 min', icon: '📖', timing: '낮', reason: 'Stimulates creativity and intellectual growth aligned with Wood' },
      { title: 'Creative hobby', duration: '30 min', icon: '🎨', timing: '저녁', reason: 'Wood energy thrives through expression and new beginnings' },
    ],
  },
  Fire: {
    meditation_text: 'Your energy burns bright today. Speak, connect, and let your heart lead.',
    foods: [
      { name: 'Tomatoes',      emoji: '🍅', reason: 'Red pigments resonate with Fire element heart energy', color_match: true },
      { name: 'Red Peppers',   emoji: '🫑', reason: 'Warming and circulatory — Fire loves to move', color_match: true },
      { name: 'Strawberries',  emoji: '🍓', reason: 'Sweet-sour balance mirrors the joy and vulnerability of Fire', color_match: false },
    ],
    colors: [
      { hex: '#E63946', name: 'Crimson',   reason: 'Bold red amplifies Fire\'s expressive, outward energy' },
      { hex: '#FF6B6B', name: 'Coral Red', reason: 'Warmer tone invites warmth and connection in your space' },
    ],
    activities: [
      { title: 'Cardio exercise', duration: '20 min', icon: '🏃', timing: '아침', reason: 'Fire rules the heart — get it pumping to activate meridian flow' },
      { title: 'Heart-to-heart conversation', duration: '15 min', icon: '💬', timing: '낮', reason: 'Fire energy peaks through genuine human connection' },
      { title: 'Dance or movement', duration: '20 min', icon: '💃', timing: '저녁', reason: 'Expressive movement releases Fire\'s passion and clears excess heat' },
    ],
  },
  Earth: {
    meditation_text: 'You are the ground beneath your own feet today. Slow down. Be nourished.',
    foods: [
      { name: 'Sweet Potato', emoji: '🍠', reason: 'Earth element nourishes the stomach and spleen — root vegetables anchor', color_match: true },
      { name: 'Corn',         emoji: '🌽', reason: 'Yellow hue and natural sweetness harmonize Earth energy', color_match: true },
      { name: 'Honey',        emoji: '🍯', reason: 'Gentle sweetness soothes the digestive center governed by Earth', color_match: false },
    ],
    colors: [
      { hex: '#D4A017', name: 'Golden Yellow', reason: 'Earth\'s primary color — brings centeredness and grounding' },
      { hex: '#8B6914', name: 'Warm Brown',    reason: 'Earthy tones connect you to the stability of the natural world' },
    ],
    activities: [
      { title: 'Seated meditation', duration: '15 min', icon: '🧘', timing: '아침', reason: 'Earth energy calls for stillness — center before the day begins' },
      { title: 'Gentle yoga', duration: '20 min', icon: '🌿', timing: '낮', reason: 'Slow, grounding poses activate the stomach and spleen meridians' },
      { title: 'Home cooking', duration: '30 min', icon: '🍳', timing: '저녁', reason: 'Preparing food is deeply Earth — nourishment given and received' },
    ],
  },
  Metal: {
    meditation_text: 'Clarity arrives when you release what no longer serves. Breathe. Refine.',
    foods: [
      { name: 'White Onion', emoji: '🧅', reason: 'Pungent foods support the lung and large intestine ruled by Metal', color_match: false },
      { name: 'Sesame Oil',  emoji: '🫚', reason: 'Lubricates Metal\'s dry meridians and aids release', color_match: false },
      { name: 'White Rice',  emoji: '🍚', reason: 'Pure, refined, and simple — mirrors Metal\'s essence of distillation', color_match: true },
    ],
    colors: [
      { hex: '#C0C0C0', name: 'Silver', reason: 'Metal\'s color — promotes clarity, precision, and boundary-setting' },
      { hex: '#F5F5F5', name: 'Pearl White', reason: 'Clean, minimal environments amplify Metal\'s refinement energy' },
    ],
    activities: [
      { title: 'Declutter one space', duration: '20 min', icon: '🧹', timing: '아침', reason: 'Metal governs letting go — physical clearing mirrors internal release' },
      { title: 'Deep breathing (4-7-8)', duration: '10 min', icon: '🌬️', timing: '낮', reason: 'Lungs are Metal\'s organ — conscious breathwork activates this meridian' },
      { title: 'Reflective writing', duration: '20 min', icon: '✍️', timing: '저녁', reason: 'Metal\'s precision finds expression in careful, intentional language' },
    ],
  },
  Water: {
    meditation_text: 'Depth is your gift today. Flow inward. Wisdom surfaces in stillness.',
    foods: [
      { name: 'Blueberries', emoji: '🫐', reason: 'Dark blue-purple pigments resonate with Water element kidney energy', color_match: true },
      { name: 'Cucumber',    emoji: '🥒', reason: 'High water content nourishes the kidney-bladder meridian pair', color_match: false },
      { name: 'Fish',        emoji: '🐟', reason: 'Omega-3s support kidney essence (精/Jing) preservation', color_match: false },
    ],
    colors: [
      { hex: '#1A1A2E', name: 'Deep Navy',  reason: 'Water\'s depth color — wear to invite introspection and wisdom' },
      { hex: '#4A90D9', name: 'Ocean Blue', reason: 'Mid-range blue connects to flow and emotional intelligence' },
    ],
    activities: [
      { title: 'Slow swimming or bathing', duration: '20 min', icon: '🏊', timing: '아침', reason: 'Water element thrives in literal water — activates kidney meridian' },
      { title: 'Dream journaling', duration: '15 min', icon: '📓', timing: '낮', reason: 'Water governs the subconscious — surfacing insights honors this energy' },
      { title: 'Silent meditation', duration: '20 min', icon: '🌙', timing: '저녁', reason: 'Water\'s energy deepens at night — stillness replenishes Jing essence' },
    ],
  },
};

// ── Claude API 호출 ──────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text ?? '';
}

// ── JSON 파싱 ────────────────────────────────────────────────────────────────

function parseRoutineContent(raw: string): RoutineContent {
  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in Claude response');

  const p = JSON.parse(match[0]) as Record<string, unknown>;

  return {
    meditation_text: String(p.meditation_text ?? '').trim(),
    foods:      Array.isArray(p.foods)      ? (p.foods      as FoodItem[]).slice(0, 3)     : [],
    colors:     Array.isArray(p.colors)     ? (p.colors     as ColorItem[]).slice(0, 2)    : [],
    activities: Array.isArray(p.activities) ? (p.activities as ActivityItem[]).slice(0, 3) : [],
  };
}

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildPrompts(
  dominant: FiveElement,
  score: Record<FiveElement, number>,
  saju: SajuData,
  language: string,
  cultural_frame: string,
  dateStr: string,
): { systemPrompt: string; userPrompt: string } {
  const langName = LANGUAGE_NAMES[language] ?? language;

  const systemPrompt =
    buildLangInstruction(language) +
    `You are a Korean 사주 master creating daily wellness routines based on the Five Elements (오행).\n` +
    `Output ONLY valid JSON, no markdown, no explanation.\n\n` +
    `오행별 기본 특성:\n` +
    `木(Wood): growth, flexibility, creativity — liver/eyes\n` +
    `火(Fire): passion, expression, connection — heart/small intestine\n` +
    `土(Earth): stability, nourishment, centering — stomach/spleen\n` +
    `金(Metal): precision, release, refinement — lung/large intestine\n` +
    `水(Water): depth, wisdom, flow — kidney/bladder\n\n` +
    `Respond ONLY in ${langName}. Be poetic but grounded. 2인칭(You/당신) 사용.`;

  const scoreStr = (Object.entries(score) as [FiveElement, number][])
    .map(([el, v]) => `${el}: ${v.toFixed(1)}`).join(' | ');

  const userPrompt =
    `오늘의 지배 오행: ${dominant} (점수: ${scoreStr})\n` +
    `사용자 사주: 일간 ${saju.day_stem} / 일지 ${saju.day_branch} / 월지 ${saju.month_branch} / 세운 ${saju.year_stem}\n` +
    `언어: ${langName}\n` +
    `문화권: ${cultural_frame}\n` +
    `오늘 날짜: ${dateStr}\n\n` +
    `다음 JSON을 반환해:\n` +
    `{\n` +
    `  "meditation_text": "CHANI 스타일 1-2문장. 오행의 에너지를 직접적이고 시적으로 표현. 2인칭 사용.",\n` +
    `  "foods": [\n` +
    `    {"name": "식품명", "emoji": "🍅", "reason": "오행 연결 이유 1문장", "color_match": true}\n` +
    `  ],\n` +
    `  "colors": [\n` +
    `    {"hex": "#E63946", "name": "색상명", "reason": "착용/인테리어 활용 제안 1문장"}\n` +
    `  ],\n` +
    `  "activities": [\n` +
    `    {"title": "활동명", "duration": "10분", "icon": "🏃", "timing": "아침/낮/저녁", "reason": "오행 연결 이유 1문장"}\n` +
    `  ]\n` +
    `}\n\n` +
    `foods 3개, colors 2개, activities 3개 (아침/낮/저녁 각 1개) 반환.\n` +
    `${cultural_frame}에 맞는 문화적 레퍼런스 사용.`;

  return { systemPrompt, userPrompt };
}

// ── 캐시 헬퍼 ────────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createClient>;

async function getCachedRoutine(
  supabase: AdminClient,
  userId: string,
  dateStr: string,
  language: string,
): Promise<(RoutineContent & { dominant_element: FiveElement; element_score: Record<FiveElement, number> }) | null> {
  try {
    const { data, error } = await supabase
      .from('daily_routine_cache')
      .select('dominant_element, element_score, meditation_text, foods, colors, activities')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .eq('language', language)
      .single();

    if (error || !data) return null;

    const row = data as Record<string, unknown>;
    return {
      dominant_element: row.dominant_element as FiveElement,
      element_score:    row.element_score    as Record<FiveElement, number>,
      meditation_text:  String(row.meditation_text ?? ''),
      foods:            Array.isArray(row.foods)      ? row.foods      as FoodItem[]     : [],
      colors:           Array.isArray(row.colors)     ? row.colors     as ColorItem[]    : [],
      activities:       Array.isArray(row.activities) ? row.activities as ActivityItem[] : [],
    };
  } catch {
    return null;
  }
}

async function storeRoutine(
  supabase: AdminClient,
  userId: string,
  dateStr: string,
  language: string,
  cultural_frame: string,
  dominant: FiveElement,
  score: Record<FiveElement, number>,
  content: RoutineContent,
): Promise<void> {
  try {
    await supabase.from('daily_routine_cache').upsert(
      {
        user_id:          userId,
        date:             dateStr,
        language,
        cultural_frame,
        dominant_element: dominant,
        element_score:    score,
        meditation_text:  content.meditation_text,
        foods:            content.foods,
        colors:           content.colors,
        activities:       content.activities,
      },
      { onConflict: 'user_id,date,language' },
    );
  } catch {
    // 캐시 저장 실패는 비치명적
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST')   return errorResponse('Method not allowed', 405);

  // 환경변수
  const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')              ?? '';
  const SUPABASE_ANON_KEY    = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')         ?? '';

  if (!ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not set', 500);

  // 인증 — k-personality-analysis와 동일한 패턴
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  let userId: string;
  if (authError || !user) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token === SUPABASE_ANON_KEY) {
      userId = '00000000-0000-4000-8000-000000000000';
    } else {
      return errorResponse('Unauthorized', 401);
    }
  } else {
    userId = user.id;
  }

  // 요청 파싱
  let body: DailyRoutineRequest;
  try {
    body = await req.json() as DailyRoutineRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const {
    saju_data,
    language       = 'en',
    cultural_frame = 'north_america',
  } = body;

  if (!saju_data?.day_stem || !saju_data?.day_branch || !saju_data?.month_branch || !saju_data?.year_stem) {
    return errorResponse('Missing required field: saju_data (day_stem, day_branch, month_branch, year_stem)', 400);
  }

  // 오늘 날짜 (KST 기준 YYYY-MM-DD)
  const now     = new Date();
  const dateStr = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  // 오행 점수 + 지배 오행 계산
  const score   = calcElementScore(saju_data);
  const dominant = dominantElement(score);

  // 캐시 조회
  const cached = await getCachedRoutine(supabaseAdmin, userId, dateStr, language);
  if (cached) {
    const resp: DailyRoutineResponse = {
      ...cached,
      date:   dateStr,
      cached: true,
    };
    return jsonResponse(resp);
  }

  // Claude API 호출
  const { systemPrompt, userPrompt } = buildPrompts(
    dominant, score, saju_data, language, cultural_frame, dateStr,
  );

  let content: RoutineContent;
  try {
    const raw = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY);
    content   = parseRoutineContent(raw);
  } catch {
    // API 실패 시 fallback 정적 데이터 사용 (캐시 저장 안 함)
    const resp: DailyRoutineResponse = {
      dominant_element: dominant,
      element_score:    score,
      ...FALLBACK[dominant],
      date:   dateStr,
      cached: false,
    };
    return jsonResponse(resp);
  }

  // 캐시 저장
  await storeRoutine(supabaseAdmin, userId, dateStr, language, cultural_frame, dominant, score, content);

  const resp: DailyRoutineResponse = {
    dominant_element: dominant,
    element_score:    score,
    ...content,
    date:   dateStr,
    cached: false,
  };
  return jsonResponse(resp);
});
