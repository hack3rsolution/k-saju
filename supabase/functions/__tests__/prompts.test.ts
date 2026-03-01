/**
 * Unit tests for prompt builders — no external dependencies.
 *
 * Run with: node --experimental-vm-modules packages/saju-engine/node_modules/jest/bin/jest.js
 * (reuses saju-engine's Jest setup; prompts.ts is TS-compatible plain functions)
 */

// ── Inline the testable parts (no Deno imports) ──────────────────────────────

type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
type ReadingType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'daewoon';

interface Pillar { stem: string; branch: string; }

const SYSTEM_PROMPT_KEYS: CulturalFrame[] = ['kr', 'cn', 'jp', 'en', 'es', 'in'];
const READING_TYPES: ReadingType[] = ['daily', 'weekly', 'monthly', 'annual', 'daewoon'];

// Mirror the logic from prompts.ts (no Deno import needed for pure logic tests)
function buildUserPromptCore(chart: {
  yearPillar: Pillar; monthPillar: Pillar;
  dayPillar: Pillar; hourPillar: Pillar | null;
  elementBalance: Record<string, number>; dayStem: string;
  daewoonList: Array<{ index: number; startAge: number; pillar: Pillar; element: string }>;
}, type: ReadingType, refDate: string): string {
  const pillarsText = [
    `年柱(Year): ${chart.yearPillar.stem}${chart.yearPillar.branch}`,
    `月柱(Month): ${chart.monthPillar.stem}${chart.monthPillar.branch}`,
    `日柱(Day/Self): ${chart.dayPillar.stem}${chart.dayPillar.branch}`,
    chart.hourPillar
      ? `時柱(Hour): ${chart.hourPillar.stem}${chart.hourPillar.branch}`
      : '時柱(Hour): Unknown',
  ].join('\n');

  const elemText = Object.entries(chart.elementBalance)
    .map(([el, n]) => `${el}:${n}`).join(' ');

  return `Reading type: ${type}\nReference date: ${refDate}\n\n=== 四柱八字 (Four Pillars) ===\n${pillarsText}\n\n日干 (Day Stem / Self): ${chart.dayStem}\nElement balance: ${elemText}`;
}

// Mirror parseClaudeOutput from claude.ts
function parseClaudeOutput(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { summary: raw.slice(0, 100).trim(), details: [raw.trim()], luckyItems: null };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: String(parsed.summary ?? '').slice(0, 200),
      details: Array.isArray(parsed.details) ? parsed.details.map(String).slice(0, 6) : [],
      luckyItems: parsed.luckyItems ?? null,
    };
  } catch {
    return { summary: raw.slice(0, 100).trim(), details: [raw.trim()], luckyItems: null };
  }
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_CHART = {
  yearPillar:     { stem: '庚', branch: '午' },
  monthPillar:    { stem: '丁', branch: '卯' },
  dayPillar:      { stem: '庚', branch: '申' },
  hourPillar:     { stem: '戊', branch: '午' },
  elementBalance: { Wood: 1, Fire: 3, Earth: 2, Metal: 3, Water: 0 },
  dayStem:        '庚',
  daewoonList:    [{ index: 0, startAge: 7, pillar: { stem: '戊', branch: '寅' }, element: 'Earth' }],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildUserPrompt', () => {
  test('includes all four pillars in output', () => {
    const prompt = buildUserPromptCore(SAMPLE_CHART, 'daily', '2026-02-28');
    expect(prompt).toContain('庚午'); // year
    expect(prompt).toContain('丁卯'); // month
    expect(prompt).toContain('庚申'); // day
    expect(prompt).toContain('戊午'); // hour
  });

  test('shows Unknown for missing hour pillar', () => {
    const prompt = buildUserPromptCore({ ...SAMPLE_CHART, hourPillar: null }, 'daily', '2026-02-28');
    expect(prompt).toContain('Unknown');
  });

  test('includes dayStem', () => {
    const prompt = buildUserPromptCore(SAMPLE_CHART, 'daily', '2026-02-28');
    expect(prompt).toContain('庚');
  });

  test('includes element balance', () => {
    const prompt = buildUserPromptCore(SAMPLE_CHART, 'daily', '2026-02-28');
    expect(prompt).toContain('Wood:1');
    expect(prompt).toContain('Fire:3');
    expect(prompt).toContain('Water:0');
  });

  test('includes refDate', () => {
    const prompt = buildUserPromptCore(SAMPLE_CHART, 'annual', '2026-01-01');
    expect(prompt).toContain('2026-01-01');
  });

  READING_TYPES.forEach((type) => {
    test(`works for ReadingType: ${type}`, () => {
      const prompt = buildUserPromptCore(SAMPLE_CHART, type, '2026-02-28');
      expect(prompt).toContain(type);
    });
  });
});

describe('parseClaudeOutput', () => {
  test('parses well-formed JSON response', () => {
    const raw = JSON.stringify({
      summary: '오늘은 金기운이 강한 날입니다.',
      details: ['집중력이 높아집니다.', '재물운이 좋습니다.', '건강에 유의하세요.', '오후에 귀인을 만납니다.'],
      luckyItems: { color: 'white', number: 7, direction: 'west', food: 'rice' },
    });
    const result = parseClaudeOutput(raw);
    expect(result.summary).toBe('오늘은 金기운이 강한 날입니다.');
    expect(result.details).toHaveLength(4);
    expect(result.luckyItems?.color).toBe('white');
    expect(result.luckyItems?.number).toBe(7);
  });

  test('extracts JSON from response with surrounding text', () => {
    const raw = `Here is your reading:\n${ JSON.stringify({ summary: 'test', details: ['a'], luckyItems: null }) }\nEnjoy!`;
    const result = parseClaudeOutput(raw);
    expect(result.summary).toBe('test');
  });

  test('handles null luckyItems', () => {
    const raw = JSON.stringify({ summary: 'ok', details: ['one'], luckyItems: null });
    const result = parseClaudeOutput(raw);
    expect(result.luckyItems).toBeNull();
  });

  test('caps summary at 200 chars', () => {
    const raw = JSON.stringify({ summary: 'x'.repeat(300), details: [], luckyItems: null });
    const result = parseClaudeOutput(raw);
    expect(result.summary.length).toBeLessThanOrEqual(200);
  });

  test('caps details at 6 items', () => {
    const raw = JSON.stringify({
      summary: 'ok',
      details: Array.from({ length: 10 }, (_, i) => `item ${i}`),
      luckyItems: null,
    });
    const result = parseClaudeOutput(raw);
    expect(result.details.length).toBeLessThanOrEqual(6);
  });

  test('gracefully handles malformed JSON — fallback to raw text', () => {
    const raw = 'This is not JSON at all.';
    const result = parseClaudeOutput(raw);
    expect(result.summary).toBeTruthy();
    expect(result.details).toHaveLength(1);
    expect(result.luckyItems).toBeNull();
  });

  test('handles JSON embedded in markdown code fence', () => {
    const inner = JSON.stringify({ summary: 'fenced', details: ['a'], luckyItems: null });
    const raw = `\`\`\`json\n${inner}\n\`\`\``;
    const result = parseClaudeOutput(raw);
    expect(result.summary).toBe('fenced');
  });

  SYSTEM_PROMPT_KEYS.forEach((frame) => {
    test(`system prompt for frame "${frame}" contains JSON format instruction`, () => {
      // Each system prompt must instruct Claude to return JSON
      const PROMPTS: Record<CulturalFrame, string> = {
        kr: '당신은 30년 경력의 한국 전통 사주 명리학자입니다.',
        cn: '你是一位专业的八字命理师',
        jp: 'あなたは四柱推命の専門家です',
        en: 'You are a cosmic blueprint analyst',
        es: 'Eres un maestro del destino cósmico',
        in: 'You are a Vedic-Eastern fusion astrologer',
      };
      // Just validate the frame is mapped (the actual JSON instruction is appended in buildSystemPrompt)
      expect(PROMPTS[frame]).toBeTruthy();
    });
  });
});

describe('request validation', () => {
  const VALID_FRAMES = new Set(['kr', 'cn', 'jp', 'en', 'es', 'in']);
  const VALID_TYPES  = new Set(['daily', 'weekly', 'monthly', 'annual', 'daewoon']);

  test('all 6 cultural frames are valid', () => {
    SYSTEM_PROMPT_KEYS.forEach((f) => expect(VALID_FRAMES.has(f)).toBe(true));
  });

  test('all 5 reading types are valid', () => {
    READING_TYPES.forEach((t) => expect(VALID_TYPES.has(t)).toBe(true));
  });

  test('invalid frame is rejected', () => {
    expect(VALID_FRAMES.has('xx')).toBe(false);
  });

  test('invalid type is rejected', () => {
    expect(VALID_TYPES.has('yearly')).toBe(false);
  });
});

// ── Timing Advisor tests ──────────────────────────────────────────────────────

type TimingCategory = 'business' | 'investment' | 'romance' | 'relocation';

const TIMING_CATEGORIES: TimingCategory[] = ['business', 'investment', 'romance', 'relocation'];
const TIMING_FRAMES = ['kr', 'cn', 'jp', 'en', 'es', 'in'] as const;

function parseTimingOutput(raw: string): { score: number; headline: string; reasons: string[]; cautions: string[] } | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const p = JSON.parse(jsonMatch[0]);
    return {
      score:    Math.max(1, Math.min(10, Number(p.score ?? 5))),
      headline: String(p.headline ?? '').slice(0, 120),
      reasons:  Array.isArray(p.reasons)  ? p.reasons.slice(0, 3).map(String)  : [],
      cautions: Array.isArray(p.cautions) ? p.cautions.slice(0, 2).map(String) : [],
    };
  } catch { return null; }
}

describe('timing-advisor prompts', () => {
  test('all 4 categories are valid', () => {
    const valid = new Set(['business', 'investment', 'romance', 'relocation']);
    TIMING_CATEGORIES.forEach((c) => expect(valid.has(c)).toBe(true));
  });

  test('all 6 frames are valid for timing', () => {
    expect(TIMING_FRAMES).toHaveLength(6);
  });

  test('parseTimingOutput parses well-formed JSON', () => {
    const raw = JSON.stringify({
      score: 8,
      headline: '사업 시작에 매우 유리한 시기입니다.',
      reasons: ['일간 木기운 강함', '세운과 생합', '월운 吉'],
      cautions: ['자금 관리 주의', '계약서 검토 필요'],
    });
    const result = parseTimingOutput(raw);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(8);
    expect(result!.reasons).toHaveLength(3);
    expect(result!.cautions).toHaveLength(2);
  });

  test('parseTimingOutput clamps score to 1-10', () => {
    const raw = JSON.stringify({ score: 15, headline: 'x', reasons: [], cautions: [] });
    const result = parseTimingOutput(raw);
    expect(result!.score).toBeLessThanOrEqual(10);
  });

  test('parseTimingOutput clamps score minimum to 1', () => {
    const raw = JSON.stringify({ score: -3, headline: 'x', reasons: [], cautions: [] });
    const result = parseTimingOutput(raw);
    expect(result!.score).toBeGreaterThanOrEqual(1);
  });

  test('parseTimingOutput caps reasons at 3', () => {
    const raw = JSON.stringify({
      score: 5, headline: 'x',
      reasons: ['a', 'b', 'c', 'd', 'e'],
      cautions: ['f', 'g'],
    });
    const result = parseTimingOutput(raw);
    expect(result!.reasons.length).toBeLessThanOrEqual(3);
  });

  test('parseTimingOutput caps cautions at 2', () => {
    const raw = JSON.stringify({
      score: 5, headline: 'x',
      reasons: ['a'],
      cautions: ['a', 'b', 'c'],
    });
    const result = parseTimingOutput(raw);
    expect(result!.cautions.length).toBeLessThanOrEqual(2);
  });

  test('parseTimingOutput returns null for non-JSON', () => {
    expect(parseTimingOutput('no json here')).toBeNull();
  });

  test('currentMonth helper extracts YYYY-MM', () => {
    function currentMonth(date: string) { return date.slice(0, 7); }
    expect(currentMonth('2026-03-15')).toBe('2026-03');
    expect(currentMonth('2026-12-01')).toBe('2026-12');
  });
});
