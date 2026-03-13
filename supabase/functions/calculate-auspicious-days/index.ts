import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── 이벤트별 오행 가중치 ─────────────────────────────────────────────────────
const EVENT_WEIGHTS: Record<string, Record<string, number>> = {
  wedding:   { wood: 1.4, fire: 1.3, earth: 1.2, metal: 0.8, water: 1.0 },
  moving:    { wood: 1.2, fire: 1.0, earth: 1.4, metal: 1.1, water: 0.9 },
  contract:  { wood: 1.0, fire: 1.1, earth: 1.3, metal: 1.5, water: 1.2 },
  interview: { wood: 1.1, fire: 1.4, earth: 1.0, metal: 1.3, water: 1.2 },
}

// ── 60갑자 ───────────────────────────────────────────────────────────────────
const HEAVENLY_STEMS   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

// 기준일: 2024-01-01 = 甲子日 (index 0)
const BASE_DATE = new Date('2024-01-01T00:00:00Z')

// ── 천간 → 오행 매핑 ─────────────────────────────────────────────────────────
const STEM_ELEMENT: Record<string, string> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
}

// ── 지지 → 오행 매핑 ─────────────────────────────────────────────────────────
const BRANCH_ELEMENT: Record<string, string> = {
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
}

// ── 상생(生) / 상극(剋) 관계 ─────────────────────────────────────────────────
// 상생: A → A가 생하는 오행
const GENERATES: Record<string, string> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
}
// 상극: A → A가 극하는 오행
const CONTROLS: Record<string, string> = {
  wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
}

// ── 날짜 → 갑자 인덱스·천간·지지 ────────────────────────────────────────────
function getGanjiForDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00Z')
  const diffDays = Math.round((date.getTime() - BASE_DATE.getTime()) / 86_400_000)
  const idx = ((diffDays % 60) + 60) % 60
  return {
    heavenlyStem:  HEAVENLY_STEMS[idx % 10],
    earthlyBranch: EARTHLY_BRANCHES[idx % 12],
    ganjiIndex:    idx,
  }
}

// ── 사주 해시 (캐시 키용) ─────────────────────────────────────────────────────
function computeSajuHash(sajuData: unknown): string {
  const str = JSON.stringify(sajuData)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

// ── 핵심: 일진 점수 계산 ──────────────────────────────────────────────────────
//
// 기존 버그: heavenlyStem/earthlyBranch를 사용하지 않아 날짜별 변화 없음.
// 수정: 일간 천간·지지의 오행이 사용자 사주 오행과 상생/상극하는지 판단해 점수 차등 적용.
//
// 채점 기준 (기본 50점):
//   천간 상생/상극 (±25), 지지 상생/상극 (±15),
//   이벤트 가중치 보너스 (±15), 길한 갑자 위치 (+8)
//
function calculateDayScore(
  heavenlyStem: string,
  earthlyBranch: string,
  ganjiIndex: number,
  sajuData: Record<string, unknown>,
  weights: Record<string, number>
): number {
  const elements = (sajuData.elements as Record<string, number>) ?? {}

  // 일진의 오행
  const stemEl   = STEM_ELEMENT[heavenlyStem]   ?? 'earth'
  const branchEl = BRANCH_ELEMENT[earthlyBranch] ?? 'earth'

  // 사용자의 지배 오행 (가장 높은 비중의 오행)
  const elEntries = Object.entries(elements) as [string, number][]
  const dominantEl = elEntries.length > 0
    ? elEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0].toLowerCase()
    : 'earth'

  // ── 천간 상생/상극 점수 ────────────────────────────────────────────────────
  let stemScore = 0
  if (stemEl === dominantEl)                    stemScore = +20  // 비화(比和): 오행 같음, 강화
  else if (GENERATES[stemEl] === dominantEl)    stemScore = +25  // 일간이 나를 생(生): 최길
  else if (GENERATES[dominantEl] === stemEl)    stemScore = +10  // 내가 일간을 생: 소모지만 길
  else if (CONTROLS[stemEl] === dominantEl)     stemScore = -25  // 일간이 나를 극(剋): 흉
  else if (CONTROLS[dominantEl] === stemEl)     stemScore = +15  // 내가 일간을 극: 내가 주도권

  // ── 지지 상생/상극 점수 (천간보다 영향 낮음) ──────────────────────────────
  let branchScore = 0
  if (branchEl === dominantEl)                    branchScore = +12
  else if (GENERATES[branchEl] === dominantEl)    branchScore = +15
  else if (GENERATES[dominantEl] === branchEl)    branchScore = +6
  else if (CONTROLS[branchEl] === dominantEl)     branchScore = -15
  else if (CONTROLS[dominantEl] === branchEl)     branchScore = +8

  // ── 이벤트 가중치 보너스: 해당 이벤트가 일간 오행을 선호하는 정도 ──────────
  // 가중치 1.0 이상이면 양수, 1.0 미만이면 음수 보너스
  const eventBonus = Math.round(((weights[stemEl] ?? 1.0) - 1.0) * 30)  // range ≈ ±15

  // ── 갑자 순환 길흉 (甲子·庚午 등 10대 길일) ──────────────────────────────
  const luckyGanji = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54]
  const ganjiBonus = luckyGanji.includes(ganjiIndex) ? 8 : 0

  const raw = 50 + stemScore + branchScore + eventBonus + ganjiBonus
  return Math.min(100, Math.max(0, Math.round(raw)))
}

// ── 월별 날짜 목록 생성 ───────────────────────────────────────────────────────
function getDaysInMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const days: string[] = []
  const lastDay = new Date(year, month, 0).getDate()
  for (let d = 1; d <= lastDay; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, '0')}`)
  }
  return days
}

// ── 서버 핸들러 ───────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, yearMonth, eventType, sajuData, language } = await req.json()

    if (!userId || !yearMonth || !eventType) {
      return Response.json({ error: 'Missing required fields: userId, yearMonth, eventType' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. 캐시 확인 ─────────────────────────────────────────────────────────
    const sajuHash = computeSajuHash(sajuData ?? {})
    const { data: cached } = await supabase
      .from('auspicious_days_cache')
      .select('days_data')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .eq('event_type', eventType)
      .eq('language', language ?? 'ko')
      .eq('saju_hash', sajuHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached?.days_data) {
      return Response.json({ data: cached.days_data, cached: true }, { headers: corsHeaders })
    }

    // ── 2. 일진 계산 ─────────────────────────────────────────────────────────
    const days = getDaysInMonth(yearMonth)
    const weights = EVENT_WEIGHTS[eventType] ?? EVENT_WEIGHTS.wedding

    const dailyScores = days.map(date => {
      const ganji = getGanjiForDate(date)
      return {
        date,
        score: calculateDayScore(
          ganji.heavenlyStem,
          ganji.earthlyBranch,
          ganji.ganjiIndex,
          sajuData ?? {},
          weights
        ),
        heavenlyStem:  ganji.heavenlyStem,
        earthlyBranch: ganji.earthlyBranch,
        status: 'neutral' as const,
      }
    })

    // ── 3. 길일/흉일 분류 (상위 30% 길일, 하위 20% 흉일) ───────────────────
    const sorted = [...dailyScores].sort((a, b) => b.score - a.score)
    const luckyThreshold   = sorted[Math.floor(sorted.length * 0.30)]?.score ?? 70
    const unluckyThreshold = sorted[Math.floor(sorted.length * 0.80)]?.score ?? 30

    const result = dailyScores.map(d => {
      // 동점 threshold 처리: lucky와 unlucky가 같은 점수면 중간 status 사용
      let status: 'lucky' | 'neutral' | 'unlucky' = 'neutral'
      if (luckyThreshold !== unluckyThreshold) {
        if (d.score >= luckyThreshold)     status = 'lucky'
        else if (d.score <= unluckyThreshold) status = 'unlucky'
      } else {
        // 모든 점수가 같을 때: 점수 절대값으로 분류
        if (d.score >= 65)      status = 'lucky'
        else if (d.score <= 40) status = 'unlucky'
      }
      return { ...d, status }
    })

    // ── 4. 캐시 저장 (만료: 7일) — 실패해도 결과는 반환 ──────────────────────
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    // UNIQUE(user_id, year_month, event_type, language) — saju_hash는 검색 필터 용도
    try {
      await supabase.from('auspicious_days_cache').upsert({
        user_id:    userId,
        year_month: yearMonth,
        event_type: eventType,
        language:   language ?? 'ko',
        days_data:  result,
        saju_hash:  sajuHash,
        expires_at: expiresAt,
      }, { onConflict: 'user_id,year_month,event_type,language' })
    } catch (cacheErr) {
      // dev 게스트 유저 FK 위반 등 캐시 오류는 무시 (결과는 정상 반환)
      console.warn('[calculate-auspicious-days] cache upsert skipped:', String(cacheErr))
    }

    return Response.json({ data: result, cached: false }, { headers: corsHeaders })
  } catch (err) {
    console.error('[calculate-auspicious-days] error:', err)
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
