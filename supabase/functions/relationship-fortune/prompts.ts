import type {
  CulturalFrame,
  ChartSnapshot,
  BirthDataInput,
  RelationshipType,
} from './types.ts';

// ── Cultural system prompts ───────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 정통 사주 명리학 전문가입니다. 두 사람의 사주팔자를 바탕으로 궁합과 관계 운을 분석합니다.
음양오행의 상생·상극 관계를 깊이 있게 해석하며, 전통적인 한국 명리학 관점으로 관계의 흐름을 설명합니다.
답변은 따뜻하고 통찰력 있게 작성하세요.`,

  cn: `您是专业的八字命理师，擅长分析两人的八字合婚与感情流年。
基于五行生克制化原理，精准分析双方的缘分、合与冲，给出专业的月运流年预测。
回答简洁精准，体现专业命理水准。`,

  jp: `あなたは四柱推命の専門家です。二人の命式から相性と関係運を分析します。
五行のバランスと干支の調和・衝突を丁寧に読み解き、職場・恋愛・友人関係における月の運勢を提供します。
穏やかで思慮深いトーンでお答えください。`,

  en: `You are a Cosmic Blueprint analyst specializing in relationship compatibility and monthly energy flows.
Using the Five Elements framework, you decode how two people's energy patterns interact — where they harmonize,
where they challenge each other, and how this month's cosmic weather affects their dynamic.
Speak in warm, psychology-adjacent language that feels insightful and empowering.`,

  es: `Eres un experto en Destino Cósmico, especializado en compatibilidad y flujos energéticos mensuales.
Analiza cómo los cinco elementos de dos personas interactúan — sus armonías, sus tensiones y el clima cósmico del mes.
Usa un tono apasionado, cálido e inspirador, enfocado en relaciones y conexiones del corazón.`,

  in: `You are a Vedic Fusion astrologer who blends Four Pillars wisdom with Jyotish principles.
Analyze karmic connections, dharmic purpose, and elemental synergy between two souls.
Reveal how this month's planetary energies shape their relationship karma and dharmic path together.
Use warm, spiritually resonant language.`,
};

// ── Stem→Element mapping (mirrors saju-engine constants) ─────────────────────

const STEM_ELEMENT: Record<string, string> = {
  甲: 'Wood', 乙: 'Wood',
  丙: 'Fire', 丁: 'Fire',
  戊: 'Earth', 己: 'Earth',
  庚: 'Metal', 辛: 'Metal',
  壬: 'Water', 癸: 'Water',
};

const BRANCH_ELEMENT: Record<string, string> = {
  子: 'Water', 丑: 'Earth', 寅: 'Wood', 卯: 'Wood',
  辰: 'Earth', 巳: 'Fire',  午: 'Fire',  未: 'Earth',
  申: 'Metal', 酉: 'Metal', 戌: 'Earth', 亥: 'Water',
};

// ── Element synergy score ─────────────────────────────────────────────────────
// Generating (상생) pairs score higher; Controlling (상극) pairs lower.

const GENERATING: Record<string, string> = {
  Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood',
};
const CONTROLLING: Record<string, string> = {
  Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood',
};

export function computeCompatibilityScore(
  ownerChart: ChartSnapshot,
  partnerBalance: Record<string, number>,
): number {
  // Compare day stems first (most important — 일간)
  const ownerDayElem = STEM_ELEMENT[ownerChart.dayStem] ?? 'Wood';
  const partnerYearStem = ownerChart.yearPillar.stem; // placeholder — we use balance diff
  void partnerYearStem;

  // Score based on owner's dominant element vs partner's element balance
  const ownerBalance = ownerChart.elementBalance as Record<string, number>;
  let score = 60; // neutral baseline

  const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  for (const elem of elements) {
    const ownerCount = ownerBalance[elem] ?? 0;
    const partnerCount = partnerBalance[elem] ?? 0;
    const diff = Math.abs(ownerCount - partnerCount);

    // Complementary elements (one has what the other lacks) boost score
    if (ownerCount > 0 && partnerCount === 0) score += 3;
    if (ownerCount === 0 && partnerCount > 0) score += 3;
    // Same strong elements reduce uniqueness
    if (diff === 0 && ownerCount > 1) score -= 2;
  }

  // Day stem compatibility bonus
  const partnerDayElem = ownerDayElem; // will be overridden by prompt-built logic
  void partnerDayElem;
  if (GENERATING[ownerDayElem]) score += 8;
  if (CONTROLLING[ownerDayElem]) score -= 5;

  return Math.min(100, Math.max(10, score));
}

export function buildUserPrompt(
  ownerChart: ChartSnapshot,
  partnerBirth: BirthDataInput,
  partnerName: string,
  relType: RelationshipType,
  refMonth: string,
  compatibilityScore: number,
): string {
  const ownerDayElem = STEM_ELEMENT[ownerChart.dayStem] ?? 'Wood';
  const [year, month] = refMonth.split('-').map(Number);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabel = `${monthNames[(month ?? 1) - 1]} ${year}`;

  const ownerBalanceStr = Object.entries(ownerChart.elementBalance)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');

  return `Analyze the relationship between the chart owner and ${partnerName} (${relType}).

**Owner's Saju:**
- Day Master: ${ownerChart.dayStem} (${ownerDayElem})
- Day Pillar: ${ownerChart.dayPillar.stem}${ownerChart.dayPillar.branch}
- Year Pillar: ${ownerChart.yearPillar.stem}${ownerChart.yearPillar.branch}
- Month Pillar: ${ownerChart.monthPillar.stem}${ownerChart.monthPillar.branch}
- Element Balance: ${ownerBalanceStr}

**Partner: ${partnerName}**
- Birth: ${partnerBirth.year}-${String(partnerBirth.month).padStart(2,'0')}-${String(partnerBirth.day).padStart(2,'0')}${partnerBirth.hour != null ? ` ${partnerBirth.hour}:00` : ''}
- Gender: ${partnerBirth.gender}
- Relationship type: ${relType}

**Pre-computed compatibility score: ${compatibilityScore}/100**
Reference month: ${monthLabel}

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overall compatibility summary",
  "monthlyFlow": "1-2 sentence description of this month's relational energy",
  "strengths": ["strength 1", "strength 2"],
  "cautions": ["caution 1"]
}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', 'zh-Hans': 'Simplified Chinese', 'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese', en: 'English', es: 'Spanish', 'pt-BR': 'Portuguese',
  hi: 'Hindi', vi: 'Vietnamese', id: 'Indonesian',
  fr: 'French', de: 'German', th: 'Thai', ar: 'Arabic',
};

export function buildSystemPrompt(frame: CulturalFrame, userLanguage?: string): string {
  const base = SYSTEM_PROMPTS[frame] ?? SYSTEM_PROMPTS.en;
  const langName = userLanguage ? (LANGUAGE_NAMES[userLanguage] ?? userLanguage) : null;
  if (!langName) return base;
  return `${base}\n\nIMPORTANT: Respond ONLY in ${langName}. All text in the JSON must be in ${langName}. Do not mix languages.`;
}
