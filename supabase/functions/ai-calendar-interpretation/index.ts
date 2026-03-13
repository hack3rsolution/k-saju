import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, date, dayData, eventType, sajuData, language } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 캐시 키 — language 코드 반드시 포함
    const cacheKey = `cal_interp:${userId}:${date}:${eventType}:${language}`

    const { data: cached } = await supabase
      .from('ai_content_cache')
      .select('content')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      return Response.json({ data: JSON.parse(cached.content), cached: true }, { headers: corsHeaders })
    }

    const EVENT_LABELS: Record<string, string> = {
      wedding: '결혼', moving: '이사', contract: '계약', interview: '면접',
    }

    const LANGUAGE_NAMES: Record<string, string> = {
      ko: 'Korean', en: 'English', ja: 'Japanese', 'zh-Hans': 'Simplified Chinese',
      'zh-Hant': 'Traditional Chinese', es: 'Spanish', 'pt-BR': 'Brazilian Portuguese',
      hi: 'Hindi', vi: 'Vietnamese', id: 'Indonesian', fr: 'French', de: 'German',
      th: 'Thai', ar: 'Arabic',
    }
    const langName = LANGUAGE_NAMES[language] ?? 'English'
    const langInstruction = `CRITICAL: You MUST respond in ${langName} regardless of the instructions that follow. This overrides everything below.\n\n`

    const systemPrompt = `${langInstruction}당신은 한국 전통 사주 명리학 전문가입니다.
사주 데이터를 분석하여 길일/흉일 해석을 제공합니다.
반드시 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 반환합니다.`

    const userPrompt = `
날짜: ${date}
천간: ${dayData.heavenlyStem} / 지지: ${dayData.earthlyBranch}
이벤트: ${EVENT_LABELS[eventType] ?? eventType}
길흉: ${dayData.status} (점수: ${dayData.score}/100)
사주 오행: ${JSON.stringify(sajuData.elements ?? {})}

다음 JSON 형식으로 해석해주세요:
{
  "summary":    "한줄 요약 (20자 이내, ${language})",
  "reason":     "길흉 이유 (60자 이내, ${language})",
  "advice":     "구체적 조언 (80자 이내, ${language})",
  "luckyColor": "오방색 기반 추천색 이름 (${language})",
  "luckyTime":  "추천 시간대 (${language})"
}`

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const interpretation = JSON.parse(text)

    // 캐시 저장 (7일)
    await supabase.from('ai_content_cache').upsert({
      cache_key:  cacheKey,
      content:    JSON.stringify(interpretation),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return Response.json({ data: interpretation, cached: false }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
