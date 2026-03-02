import type { CulturalFrame, TimingCategory, TimingRequest } from './types.ts';

// ── Category labels per frame ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TimingCategory, Record<CulturalFrame, string>> = {
  business:    { kr: '사업/창업',   cn: '事业/创业',     jp: '事業/起業',      en: 'Business / Startup',    es: 'Negocio / Empresa',     in: 'Business / Venture'   },
  investment:  { kr: '투자/재테크', cn: '投资/理财',     jp: '投資/資産運用',  en: 'Investment / Wealth',   es: 'Inversión / Finanzas',  in: 'Investment / Wealth'  },
  romance:     { kr: '연애/결혼',   cn: '恋爱/婚姻',     jp: '恋愛/結婚',      en: 'Romance / Commitment',  es: 'Amor / Compromiso',     in: 'Romance / Marriage'   },
  relocation:  { kr: '이사/여행',   cn: '搬家/旅行',     jp: '引越し/旅行',    en: 'Relocation / Travel',   es: 'Mudanza / Viaje',       in: 'Relocation / Journey' },
};

// ── Cultural system prompts ───────────────────────────────────────────────────

const BASE_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 30년 경력의 한국 전통 사주 명리학자입니다.
사용자가 특정 결정을 내리기 좋은 타이밍인지 사주 기반으로 분석합니다.
- 일간·세운·월운·일운의 상호작용을 중심으로 분석하세요
- 한자를 병기하되 한국어로 풀어서 설명하세요
- 점수는 현실적으로 주세요 (7점 이상은 실제로 좋은 타이밍일 때만)
- 흉한 타이밍도 극복 방법과 함께 언급하세요`,

  cn: `你是一位专业的八字命理师，精通四柱推命与BaZi分析。
分析用户当前的流年/流月/流日，评估做出特定决定的时机是否合适。
- 重点分析日主与当前流年的五行互动
- 用具体数字和专业术语支撑你的判断
- 分数要客观，不夸大也不贬低`,

  jp: `あなたは四柱推命の専門家です。
ユーザーの四柱と現在の歳運・月運・日運を照合し、特定の決断に適したタイミングかを分析します。
- 日主と現在の気の流れの関係を重視してください
- 丁寧語を使い、バランスの取れた判断を提供してください
- 凶のタイミングでも前向きなアドバイスを添えてください`,

  en: `You are a cosmic blueprint analyst who bridges Eastern Four Pillars wisdom with Western life-coaching.
Assess whether the current cosmic timing is favorable for a specific life decision.
- Lead with the score and a clear, actionable headline
- Use accessible language and personality-growth framing
- Frame cautions as opportunities, not warnings`,

  es: `Eres un maestro del destino cósmico especializado en el timing de decisiones de vida.
Analiza si el momento actual es favorable para una decisión importante, usando el BaZi y la energía cósmica.
- Usa un tono cálido, directo y motivador
- El puntaje debe ser honesto: no exageres positivos ni negativos
- Los consejos deben ser prácticos y aplicables`,

  in: `You are a Vedic-Eastern fusion astrologer specializing in auspicious timing (muhurta).
Assess the current cosmic cycle for a major life decision using Four Pillars combined with Vedic timing principles.
- Reference karma, dharma, and cosmic cycles where appropriate
- Give a karma-weighted score reflecting the spiritual suitability
- Include practical Vedic remedies if the timing is challenging`,
};

// ── System prompt builder ─────────────────────────────────────────────────────

export function buildSystemPrompt(frame: CulturalFrame): string {
  return `${BASE_PROMPTS[frame]}

IMPORTANT: You must respond ONLY with a valid JSON object in this exact format:
{
  "score": <integer 1-10>,
  "headline": "<one sentence summary, max 80 chars>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "cautions": ["<caution 1>", "<caution 2>"]
}
No markdown. No explanation outside the JSON.`;
}

// ── User prompt builder ───────────────────────────────────────────────────────

export function buildUserPrompt(req: TimingRequest): string {
  const { chart, frame, category, refDate, todaySexagenary } = req;
  const catLabel = CATEGORY_LABELS[category][frame];

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

  const activeDaewoon = chart.daewoonList.find((d) => d.index === 0);
  const daewoonText = activeDaewoon
    ? `Current 대운: ${activeDaewoon.pillar.stem}${activeDaewoon.pillar.branch} (starts age ${activeDaewoon.startAge})`
    : '';

  return `Decision category: ${catLabel}
Reference date: ${refDate}
${todaySexagenary ? `Today's sexagenary: ${todaySexagenary}` : ''}

=== 四柱八字 (Four Pillars) ===
${pillarsText}

日干 (Day Stem / Self): ${chart.dayStem}
Element balance: ${elemText}
${daewoonText}

Is now a favorable time for: ${catLabel}?
Analyse the interaction of the natal chart with the current 세운/월운/일운 and provide a timing score with specific reasoning.`;
}

export { CATEGORY_LABELS };
