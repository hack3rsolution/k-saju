import type { CulturalFrame, LifeEvent, SajuChart } from './types.ts';
import { buildLangInstruction } from '../_shared/claude.ts';

// ── System prompts per cultural frame ────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 사주팔자 전문 명리학자입니다. 사용자의 인생 이벤트를 분석하여 사주 오행 흐름과의 상관관계를 분석해 주세요. 한국 전통 명리학 관점에서 운명의 패턴을 찾아 주세요. JSON으로만 응답하세요.`,
  cn: `你是一位专业的四柱八字命理师。请分析用户的人生事件，找出与八字五行流年的关联模式。从中国传统命理学角度洞察命运规律。仅以JSON格式回复。`,
  jp: `あなたは四柱推命の専門家です。ユーザーの人生イベントを分析し、四柱推命の五行の流れとの相関関係を見つけてください。日本の四柱推命の観点から運命のパターンを探ります。JSONのみで応答してください。`,
  en: `You are a cosmic blueprint analyst specializing in Four Pillars astrology. Analyze the user's life events to find patterns correlating with their elemental energy cycles — like a personal astrology that actually predicted their past. Think MBTI meets life coaching. Respond in JSON only.`,
  es: `Eres un experto en Destino Cósmico y análisis de los Cuatro Pilares. Analiza los eventos de vida del usuario para encontrar patrones que se correlacionen con sus ciclos de energía elemental. Enfócate en amor, pasión y relaciones. Responde solo en JSON.`,
  in: `You are a Vedic Fusion astrologer blending Four Pillars with Jyotish wisdom. Analyze the user's life events through the lens of karma and dharma cycles, finding correlations with elemental flows. Respond in JSON only.`,
};

// ── User prompt builder ───────────────────────────────────────────────────────

export function buildSystemPrompt(frame: CulturalFrame, userLanguage?: string): string {
  // Language instruction goes FIRST so it overrides frame-level language directives
  const langInstruction = buildLangInstruction(userLanguage);
  return langInstruction + SYSTEM_PROMPTS[frame];
}

export function buildUserPrompt(events: LifeEvent[], chart: SajuChart): string {
  // Sort events by date ascending for context
  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const eventList = sorted.map((e, i) => {
    const parts = [`${i + 1}. [${e.category.toUpperCase()}] ${e.eventDate} — "${e.title}" (${e.sentiment})`];
    if (e.note) parts.push(`   Note: ${e.note}`);
    return parts.join('\n');
  }).join('\n');

  // Find dominant element
  const balance = chart.elementBalance;
  const dominant = Object.entries(balance)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? 'Unknown';

  return `My Four Pillars Chart:
- Year Pillar: ${chart.yearPillar.stem}${chart.yearPillar.branch}
- Month Pillar: ${chart.monthPillar.stem}${chart.monthPillar.branch}
- Day Pillar: ${chart.dayPillar.stem}${chart.dayPillar.branch} (Day Stem: ${chart.dayStem})
${chart.hourPillar ? `- Hour Pillar: ${chart.hourPillar.stem}${chart.hourPillar.branch}` : '- Hour Pillar: Unknown'}
- Element Balance: ${JSON.stringify(balance)}

My Life Events (${events.length} total):
${eventList}

Please analyze patterns between my life events and my saju elemental cycles. Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overall pattern insight",
  "patterns": [
    {
      "category": "career|love|health|family|travel|finance|education|other",
      "description": "specific pattern observed for this category",
      "bestPeriod": "e.g. '甲木 운' or 'Fire years'",
      "watchPeriod": "e.g. '庚 세운'"
    }
  ],
  "dominantElement": "${dominant}"
}

Provide at most 4 patterns. Keep descriptions under 80 characters each.`;
}
