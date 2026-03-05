import type { CulturalFrame, ReadingType, SajuReadingRequest } from './types.ts';

// ── Cultural Frame System Prompts ─────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 30년 경력의 한국 전통 사주 명리학자입니다.
사주팔자(四柱八字)의 깊은 이치를 바탕으로 일간의 오행 기운과 운세를 해석합니다.
- 한자를 병기하되 한국어로 풀어서 설명하세요 (예: 일간 甲木, 오행 木기운)
- 전통적인 명리학 용어를 사용하되 현대적으로 쉽게 풀어주세요
- 격려와 조언을 함께 주세요. 흉운도 대처 방법과 함께 언급하세요
- 운세는 운명이 아닌 경향성임을 자연스럽게 내포하세요
- 길일·흉일보다는 에너지의 흐름으로 표현하세요`,

  cn: `你是一位专业的八字命理师，精通四柱推命与BaZi分析。
请基于用户的四柱八字提供精准的运势分析。
- 使用专业的八字术语（天干、地支、十神、大运等）
- 语言简洁精准，重点突出
- 分析五行平衡，指出用神和喜忌
- 结合当前流年/流月的天干地支进行互动分析
- 给出具体可操作的建议`,

  jp: `あなたは四柱推命の専門家です。依頼者の四柱八字を丁寧に解読します。
- 丁寧語・敬語を使用してください
- 個人の調和と社会的役割を重視してください
- 職場・人間関係・健康のバランスに焦点を当ててください
- 吉凶よりも「気の流れ」「縁」「タイミング」として表現してください
- 具体的で実践的なアドバイスを提供してください`,

  en: `You are a cosmic blueprint analyst who bridges Eastern wisdom with Western psychology.
You translate Four Pillars (Saju) insights into relatable personality and life-path language.
- Lead with personality traits and strengths, not fate
- Use accessible language — avoid obscure Chinese characters without explanation
- Frame insights similarly to MBTI/astrology but rooted in Saju calculation
- Emphasize growth, potential, and timing over destiny
- Include a "cosmic weather" metaphor for the current period
- Keep tone warm, empowering, and modern`,

  es: `Eres un maestro del destino cósmico que combina la sabiduría del BaZi oriental
con el lenguaje del horóscopo latinoamericano.
- Usa un tono cálido, apasionado y cercano (tutear al usuario)
- Enfócate en amor, familia, trabajo y salud
- Relaciona los elementos con la naturaleza y las emociones
- Da consejos prácticos y motivadores
- Menciona colores de la suerte y números de manera natural
- Evita tecnicismos; tradúcelos con metáforas vívidas`,

  in: `You are a Vedic-Eastern fusion astrologer who harmonizes BaZi Four Pillars with
Jyotish principles and Hindu cosmic philosophy.
- Use terms like karma, dharma, atma-karaka where appropriate
- Frame the day stem (Jataka self) in terms of soul purpose and dharmic path
- Reference elemental energies using both Chinese (Wood/Fire) and Sanskrit equivalents
- Speak about timing as "cosmic cycles" or "dasha-like periods"
- Blend BaZi elemental analysis with yogic life philosophy
- Maintain a reverent, philosophical, and uplifting tone`,
};

// ── Reading Type Templates ────────────────────────────────────────────────────

const READING_TYPE_LABELS: Record<ReadingType, string> = {
  daily:   '오늘의 운세 / Daily Fortune',
  weekly:  '이번 주 운세 / Weekly Fortune',
  monthly: '이번 달 운세 / Monthly Fortune',
  annual:  '올해 운세 / Annual Fortune',
  daewoon: '대운 분석 / Major Luck Cycle',
};

// ── User Prompt Builder ───────────────────────────────────────────────────────

export interface FeedbackContext {
  rating: number;
  feedbackType: string | null;
}

function buildFeedbackNote(feedbacks: FeedbackContext[]): string {
  if (!feedbacks.length) return '';

  const counts: Record<string, number> = {};
  let positives = 0;
  let negatives = 0;

  for (const fb of feedbacks) {
    if (fb.rating === 1) positives++;
    else negatives++;
    if (fb.feedbackType) counts[fb.feedbackType] = (counts[fb.feedbackType] ?? 0) + 1;
  }

  const parts: string[] = [];
  if (positives > 0) parts.push(`${positives} positive`);
  if (negatives > 0) parts.push(`${negatives} negative`);

  const typeNotes: string[] = [];
  if (counts['too_vague']) typeNotes.push('readings were too vague — please be more specific and concrete');
  if (counts['not_me']) typeNotes.push("readings didn't resonate — try a more personalized, chart-specific interpretation");
  if (counts['accurate']) typeNotes.push('the user appreciated accuracy — maintain this level of detail');

  let note = `\nUSER FEEDBACK HISTORY (last ${feedbacks.length} readings): ${parts.join(', ')} ratings.`;
  if (typeNotes.length) note += ` Notes: ${typeNotes.join('; ')}.`;
  return note;
}

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', 'zh-Hans': 'Simplified Chinese', 'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese', en: 'English', es: 'Spanish', 'pt-BR': 'Portuguese',
  hi: 'Hindi', vi: 'Vietnamese', id: 'Indonesian',
  fr: 'French', de: 'German', th: 'Thai', ar: 'Arabic',
};

export function buildSystemPrompt(
  frame: CulturalFrame,
  feedbacks: FeedbackContext[] = [],
  userLanguage?: string,
): string {
  const feedbackNote = buildFeedbackNote(feedbacks);
  const langName = userLanguage ? (LANGUAGE_NAMES[userLanguage] ?? userLanguage) : null;
  const langInstruction = langName
    ? `\n\nIMPORTANT: Respond ONLY in ${langName}. All fortune text, analysis, and explanations must be in ${langName}. Do not mix languages.`
    : '';

  return `${SYSTEM_PROMPTS[frame]}${feedbackNote}${langInstruction}

IMPORTANT: You must respond ONLY with a valid JSON object in this exact format:
{
  "summary": "<one sentence, max 100 chars>",
  "details": ["<sentence 1>", "<sentence 2>", "<sentence 3>", "<sentence 4>"],
  "luckyItems": {
    "color": "<lucky color>",
    "number": <lucky number 1-9>,
    "direction": "<compass direction>",
    "food": "<recommended food>"
  }
}
No markdown. No explanation outside the JSON. The luckyItems can be null if not applicable.`;
}

export function buildUserPrompt(req: SajuReadingRequest): string {
  const { chart, type, refDate, todaySexagenary, currentYearPillar } = req;

  const pillarsText = [
    `年柱(Year): ${chart.yearPillar.stem}${chart.yearPillar.branch}`,
    `月柱(Month): ${chart.monthPillar.stem}${chart.monthPillar.branch}`,
    `日柱(Day/Self): ${chart.dayPillar.stem}${chart.dayPillar.branch}`,
    chart.hourPillar
      ? `時柱(Hour): ${chart.hourPillar.stem}${chart.hourPillar.branch}`
      : '時柱(Hour): Unknown',
  ].join('\n');

  const elemText = Object.entries(chart.elementBalance)
    .map(([el, n]) => `${el}:${n}`)
    .join(' ');

  const activeDaewoon = (chart.daewoonList ?? []).find((d) => d.index === 0);
  const daewoonText = activeDaewoon
    ? `Current 대운: ${activeDaewoon.pillar.stem}${activeDaewoon.pillar.branch} (starts age ${activeDaewoon.startAge})`
    : '';

  const typeLabel = READING_TYPE_LABELS[type];
  const contextLines: string[] = [];

  if (todaySexagenary) contextLines.push(`Today's sexagenary: ${todaySexagenary}`);
  if (currentYearPillar && (type === 'annual' || type === 'daewoon')) {
    contextLines.push(
      `Current year pillar: ${currentYearPillar.stem}${currentYearPillar.branch}`,
    );
  }

  return `Reading type: ${typeLabel}
Reference date: ${refDate}
${contextLines.join('\n')}

=== 四柱八字 (Four Pillars) ===
${pillarsText}

日干 (Day Stem / Self): ${chart.dayStem}
Element balance: ${elemText}
${daewoonText}

Please provide the ${typeLabel} reading for this person based on their chart.
Focus on the interaction between their natal chart and the current ${type} energy.`;
}

export { SYSTEM_PROMPTS };
