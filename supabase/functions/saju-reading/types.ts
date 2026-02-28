// ── Shared with packages/saju-engine (duplicated here for Deno portability) ──

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
export type ReadingType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'daewoon';

export interface Pillar {
  stem: string;
  branch: string;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface ElementBalance {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

export interface DaewoonPeriod {
  index: number;
  startAge: number;
  pillar: Pillar;
  element: string;
}

// ── Request payload ──────────────────────────────────────────────────────────

export interface SajuReadingRequest {
  /** Saju chart data from the DB (SajuChart record) */
  chart: {
    yearPillar: Pillar;
    monthPillar: Pillar;
    dayPillar: Pillar;
    hourPillar: Pillar | null;
    elementBalance: ElementBalance;
    dayStem: string;
    daewoonList: DaewoonPeriod[];
  };
  frame: CulturalFrame;
  type: ReadingType;
  /** ISO date string YYYY-MM-DD — the date this reading is for */
  refDate: string;
  /** Current day's sexagenary stem+branch e.g. "甲子" */
  todaySexagenary?: string;
  /** Current year pillar for annual readings */
  currentYearPillar?: Pillar;
}

// ── Response payload ─────────────────────────────────────────────────────────

export interface LuckyItems {
  color?: string;
  number?: number;
  direction?: string;
  food?: string;
}

export interface SajuReadingResponse {
  ok: true;
  cached: boolean;
  reading: {
    summary: string;
    details: string[];
    luckyItems: LuckyItems | null;
    rawContent?: string;
  };
}

// ── Claude structured output ─────────────────────────────────────────────────

export interface ClaudeReadingOutput {
  summary: string;
  details: string[];
  luckyItems: LuckyItems | null;
}
