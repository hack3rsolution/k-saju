import type {
  CulturalFrame,
  AddonReportType,
  ChartPayload,
  AddonReportRequest,
} from './types.ts';

// ── Output format instructions ────────────────────────────────────────────────

const JSON_FORMAT = `

OUTPUT: Raw JSON only. Start with { end with }. No markdown, no prose.
{
  "title": "<short title>",
  "overview": "<1-2 sentences>",
  "sections": [
    { "heading": "<heading>", "content": "<max 150 chars>" }
  ]
}
Exactly 2 sections. Content under 150 characters each.`;

// ── Cultural system prompts (brief, report-focused variants) ──────────────────

const SYSTEM_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 30년 경력의 한국 전통 사주 명리학자입니다.
깊이 있는 명리학 분석을 바탕으로 상세한 리포트를 작성합니다.
한자를 병기하고 전통 용어를 사용하되 현대적으로 쉽게 풀어주세요.${JSON_FORMAT}`,

  cn: `你是一位专业的八字命理师，擅长深度命理分析报告。
使用专业的八字术语，提供详尽、精准的命理报告。${JSON_FORMAT}`,

  jp: `あなたは四柱推命の専門家です。詳細な命理レポートを丁寧に作成します。
敬語を使い、深い洞察と実践的なアドバイスを提供してください。${JSON_FORMAT}`,

  en: `You are a cosmic blueprint analyst bridging Eastern wisdom with Western psychology.
Write an in-depth, accessible report using modern language and relatable metaphors.${JSON_FORMAT}`,

  es: `Eres un maestro del destino cósmico. Escribe un informe detallado y apasionado
usando lenguaje cercano y metáforas vívidas.${JSON_FORMAT}`,

  in: `You are a Vedic-Eastern fusion astrologer. Write a comprehensive destiny report
blending BaZi analysis with Jyotish wisdom and dharmic philosophy.${JSON_FORMAT}`,
};

// ── Chart formatter helper ────────────────────────────────────────────────────

function formatChart(chart: ChartPayload, label = 'Chart'): string {
  const pillars = [
    `年柱(Year): ${chart.yearPillar.stem}${chart.yearPillar.branch}`,
    `月柱(Month): ${chart.monthPillar.stem}${chart.monthPillar.branch}`,
    `日柱(Day/Self): ${chart.dayPillar.stem}${chart.dayPillar.branch}`,
    chart.hourPillar
      ? `時柱(Hour): ${chart.hourPillar.stem}${chart.hourPillar.branch}`
      : `時柱(Hour): Unknown`,
  ].join('\n');

  const elem = Object.entries(chart.elementBalance)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');

  return `=== ${label} (四柱八字) ===
${pillars}
日干 (Day Stem/Self): ${chart.dayStem}
Element balance: ${elem}`;
}

// ── User prompt builders ──────────────────────────────────────────────────────

function buildCompatibilityPrompt(req: AddonReportRequest): string {
  const userChart = formatChart(req.chart, "Person A's Chart");
  const partnerChart = req.partnerChart
    ? formatChart(req.partnerChart, "Person B's Chart")
    : 'Partner chart not provided';

  return `Report type: Deep Compatibility Analysis (궁합/合婚)

${userChart}

${partnerChart}

Analyze: element harmony/clashes, day stem relationship, elemental complement or conflict, and key advice.
Give an overall harmony level (very high/high/moderate/challenging).`;
}

function buildCareerPrompt(req: AddonReportRequest): string {
  const chart = formatChart(req.chart);
  const birthYear = req.birthYear ?? 0;
  const currentAge = birthYear > 0 ? new Date().getFullYear() - birthYear : 0;

  const activeDw = req.chart.daewoonList.find((d) => d.startAge <= currentAge && d.startAge + 9 >= currentAge);
  const dwText = activeDw
    ? `Current 대운: ${activeDw.pillar.stem}${activeDw.pillar.branch} (age ${activeDw.startAge}–${activeDw.startAge + 9})`
    : 'Current 대운: not determined';

  return `Report type: Career & Wealth Analysis (재물운/관운)

${chart}
${dwText}
Current approximate age: ${currentAge || 'unknown'}

Analyze: wealth stars (재성), career stars (관성), optimal career domains, and current 대운 timing.
Include specific near-term opportunities and cautions. Keep it actionable.`;
}

function buildDaewoonFullPrompt(req: AddonReportRequest): string {
  const chart = formatChart(req.chart);
  const birthYear = req.birthYear ?? 0;
  const currentAge = birthYear > 0 ? new Date().getFullYear() - birthYear : 0;

  const dwText = req.chart.daewoonList
    .map((d) => {
      const isCurrent = d.startAge <= currentAge && d.startAge + 9 >= currentAge;
      return `Period ${d.index + 1}: ${d.pillar.stem}${d.pillar.branch} (age ${d.startAge}–${d.startAge + 9}, element: ${d.element})${isCurrent ? ' ← CURRENT' : ''}`;
    })
    .join('\n');

  return `Report type: Full 대운 (Major Luck Cycle) Report

${chart}

10-Year Major Luck Cycles (大運):
${dwText}

Current age: ${currentAge || 'unknown'}

For each period give: dominant element interaction with natal chart, life theme, and one key opportunity or caution.
Also provide an overall life arc (early/mid/late) and peak fortune windows.`;
}

function buildNameAnalysisPrompt(req: AddonReportRequest): string {
  const chart = formatChart(req.chart);
  const name = req.name ?? 'Name not provided';

  return `Report type: Name Analysis (작명/이름 분석)

${chart}

Name to analyze: ${name}

Analyze: phonetic energy, element association (stroke count if 한자), name-chart harmony, and 2 alternative suggestions.
Keep the analysis culturally sensitive and focused.`;
}

// ── Public interface ──────────────────────────────────────────────────────────

const REPORT_BUILDERS: Record<
  AddonReportType,
  (req: AddonReportRequest) => string
> = {
  compatibility: buildCompatibilityPrompt,
  career: buildCareerPrompt,
  daewoon_full: buildDaewoonFullPrompt,
  name_analysis: buildNameAnalysisPrompt,
};

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', 'zh-Hans': 'Simplified Chinese', 'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese', en: 'English', es: 'Spanish', 'pt-BR': 'Portuguese',
  hi: 'Hindi', vi: 'Vietnamese', id: 'Indonesian',
  fr: 'French', de: 'German', th: 'Thai', ar: 'Arabic',
};

export function buildSystemPrompt(frame: CulturalFrame, userLanguage?: string): string {
  const base = SYSTEM_PROMPTS[frame];
  const langName = userLanguage ? (LANGUAGE_NAMES[userLanguage] ?? userLanguage) : null;
  if (!langName) return base;
  // Language instruction goes FIRST so it overrides frame-level language directives
  return `CRITICAL: You must respond ONLY in ${langName}. All report text (title, overview, sections) must be written entirely in ${langName}. Do not use Korean or any other language regardless of the instructions that follow.\n\n${base}`;
}

export function buildUserPrompt(req: AddonReportRequest): string {
  const builder = REPORT_BUILDERS[req.reportType];
  return builder(req);
}
