import type { CulturalFrame, ChartSnapshot, TodayReading } from './types.ts';
import { buildLangInstruction } from '../_shared/claude.ts';

// ── Cultural-frame system prompts ─────────────────────────────────────────────

const FRAME_SYSTEM: Record<CulturalFrame, string> = {
  kr: `당신은 한국 전통 사주팔자 전문가입니다. 사용자의 오늘 운세를 바탕으로 팔로업 질문에 친절하고 통찰 있게 답변하세요.
답변은 한국어로, 따뜻하고 공감적이며 전통 사주 용어를 자연스럽게 사용합니다.
간결하게 3-5문장으로 답하되, 실용적인 조언을 포함하세요.`,

  cn: `你是一位精通中国四柱命理（BaZi）的专家。请根据用户今日运势回答跟进问题。
用中文回答，风格精准、专业，适当使用命理术语。
回答简洁（3-5句），注重时机与决策的实际建议。`,

  jp: `あなたは日本の四柱推命の専門家です。ユーザーの本日の運勢に基づいてフォローアップ質問に答えてください。
日本語で、丁寧で調和を重視したスタイルで答えてください。四柱推命の用語を自然に使用します。
3〜5文で簡潔に、職場での調和や人間関係への実践的なアドバイスを含めてください。`,

  en: `You are a cosmic blueprint advisor specializing in Korean Four Pillars astrology for a global audience.
Answer follow-up questions about the user's daily fortune in an accessible, psychology-forward style — think MBTI meets astrology.
Respond in English, warm and insightful, 3-5 sentences with practical actionable advice.`,

  es: `Eres un experto en astrología cósmica basada en los Cuatro Pilares coreanos. Responde preguntas de seguimiento sobre la fortuna diaria del usuario.
Responde en español, con un tono cercano, apasionado y esperanzador — similar al horóscopo pero más personalizado.
Sé conciso (3-5 oraciones) con consejos prácticos sobre relaciones y oportunidades del día.`,

  in: `You are a Vedic-fusion destiny guide blending Korean Four Pillars with Jyotish wisdom.
Answer the user's follow-up questions about their daily fortune with references to karma, dharma, and cosmic timing.
Respond in English with a warm, spiritual tone, 3-5 sentences, offering practical guidance aligned with their chart.`,
};

// ── Suggested questions per frame ────────────────────────────────────────────

export const SUGGESTED_QUESTIONS: Record<CulturalFrame, string[]> = {
  kr: ['오늘 중요한 결정을 내려도 될까요?', '연애운은 어떤가요?', '재물운을 높이려면 어떻게 해야 하나요?'],
  cn: ['今天适合签合同吗？', '如何提升今天的财运？', '感情方面今天有什么建议？'],
  jp: ['今日は重要な決断をしても良いですか？', '職場での人間関係はどうですか？', '今日のラッキーな行動は？'],
  en: ['Should I make an important decision today?', 'How can I make the most of my lucky elements?', 'What areas should I focus on this week?'],
  es: ['¿Es buen día para tomar decisiones importantes?', '¿Cómo está mi suerte en el amor hoy?', '¿Qué debo evitar hoy según mi carta astral?'],
  in: ['Is today auspicious for new beginnings?', 'How can I align with my dharma today?', 'What karma should I be mindful of this week?'],
};

// ── System prompt builder ─────────────────────────────────────────────────────

export function buildSystemPrompt(
  frame: CulturalFrame,
  chart: ChartSnapshot,
  reading: TodayReading,
  userLanguage?: string,
): string {
  const langInstruction = buildLangInstruction(userLanguage);
  const el = chart.elementBalance;
  const dominant = Object.entries(el).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Wood';

  const chartSummary = [
    `Year: ${chart.yearPillar.stem}${chart.yearPillar.branch}`,
    `Month: ${chart.monthPillar.stem}${chart.monthPillar.branch}`,
    `Day (self): ${chart.dayPillar.stem}${chart.dayPillar.branch}`,
    chart.hourPillar ? `Hour: ${chart.hourPillar.stem}${chart.hourPillar.branch}` : null,
    `Day Master (일간): ${chart.dayStem}`,
    `Dominant element: ${dominant}`,
    `Element balance: ${Object.entries(el).map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ].filter(Boolean).join(' | ');

  const readingSummary = [
    `Today's fortune summary: ${reading.summary}`,
    `Details: ${reading.details.join(' / ')}`,
  ].join('\n');

  return `${langInstruction}${FRAME_SYSTEM[frame]}

USER'S SAJU CHART:
${chartSummary}

TODAY'S FORTUNE CONTEXT:
${readingSummary}

Always answer in the context of this specific chart and today's fortune reading.
Keep responses focused, empathetic, and between 3-5 sentences.`;
}
