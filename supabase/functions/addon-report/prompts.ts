import type {
  CulturalFrame,
  AddonReportType,
  ChartPayload,
  AddonReportRequest,
} from './types.ts';

// ── Output format instructions ────────────────────────────────────────────────

const JSON_FORMAT = `
IMPORTANT: Respond ONLY with a valid JSON object in this exact format (no markdown):
{
  "title": "<report title>",
  "overview": "<2–3 sentence executive summary>",
  "sections": [
    { "heading": "<section title>", "content": "<detailed paragraph>" },
    ...
  ]
}
Produce 4–6 sections. Each section content should be 3–6 sentences.`;

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

Analyze the compatibility between these two charts:
1. Element harmony and clashes (합충형파해 — harmony/clash/penalty/destruction)
2. Day stem relationship (십신 interaction between the two 일간)
3. Elemental balance complement or conflict
4. Long-term relationship energy (5-year outlook by 대운)
5. Communication style compatibility
6. Areas of natural alignment and potential friction
7. Advice for strengthening the relationship

Provide a thorough compatibility report with an overall harmony score concept (very high/high/moderate/challenging).`;
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

Analyze this person's career and wealth potential:
1. 재성(財星) — wealth stars: presence, strength, and timing
2. 관성(官星) — authority/career stars: leadership potential and career trajectory
3. 식상(食傷) — creative output stars: entrepreneurship and innovation potential
4. Optimal career domains based on dominant elements
5. Best timing windows for career advancement, business launch, or investment (by current 대운)
6. Wealth accumulation patterns and risk-taking tendencies
7. Specific 2025–2027 opportunities and cautions

Provide a forward-looking career and wealth report with actionable timing advice.`;
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

Provide a comprehensive 대운 report covering all 8 major luck periods:
For each period, analyze:
- The dominant element energy and its interaction with the natal chart
- Life theme: career, relationships, health, spirituality
- Key opportunities and challenges
- Recommended focus areas
- Elemental clashes or harmonies with natal pillars

Additionally provide:
- Overall life arc narrative (early life, mid-life, later life themes)
- The person's peak fortune windows
- Areas requiring consistent attention across all periods

Write a detailed, inspiring report that helps the person understand their entire life journey.`;
}

function buildNameAnalysisPrompt(req: AddonReportRequest): string {
  const chart = formatChart(req.chart);
  const name = req.name ?? 'Name not provided';

  return `Report type: Name Analysis (작명/이름 분석)

${chart}

Name to analyze: ${name}

Analyze this name in relation to the person's saju chart:
1. Phonetic energy of the name (sound vibration and meaning)
2. If the name contains Chinese characters (한자), analyze each character's:
   - Stroke count and element association
   - Meaning and symbolic energy
   - Compatibility with the natal day stem (일간)
3. Element balance: does the name complement or conflict with chart deficiencies?
4. Overall name-chart harmony assessment
5. If adjustments are suggested, explain why and what element qualities to seek
6. 2–3 alternative name suggestions (Korean or Chinese) with element rationale
7. Lucky name characteristics for this person's chart

Provide a thoughtful, culturally sensitive name analysis report.`;
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

export function buildSystemPrompt(frame: CulturalFrame): string {
  return SYSTEM_PROMPTS[frame];
}

export function buildUserPrompt(req: AddonReportRequest): string {
  const builder = REPORT_BUILDERS[req.reportType];
  return builder(req);
}
