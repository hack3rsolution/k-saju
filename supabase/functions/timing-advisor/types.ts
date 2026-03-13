// ── Shared types for timing-advisor Edge Function ────────────────────────────

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
export type TimingCategory = 'business' | 'investment' | 'romance' | 'relocation';

export interface Pillar { stem: string; branch: string; }

export interface TimingRequest {
  chart: {
    yearPillar: Pillar;
    monthPillar: Pillar;
    dayPillar: Pillar;
    hourPillar: Pillar | null;
    elementBalance: Record<string, number>;
    dayStem: string;
    daewoonList: Array<{
      index: number;
      startAge: number;
      pillar: Pillar;
      element: string;
    }>;
  };
  frame: CulturalFrame;
  category: TimingCategory;
  /** ISO date string YYYY-MM-DD — the date to analyse */
  refDate: string;
  /** Today's sexagenary stem+branch e.g. "甲子" */
  todaySexagenary?: string;
  /** BCP-47 language code e.g. 'ko', 'en', 'ja' */
  userLanguage?: string;
}

export interface TimingResponse {
  ok: true;
  cached: boolean;
  limitReached?: boolean;
  advice: {
    score: number;         // 1–10
    headline: string;      // one-liner
    reasons: string[];     // 3 items
    cautions: string[];    // 2 items
  };
}

export interface ClaudeTimingOutput {
  score: number;
  headline: string;
  reasons: string[];
  cautions: string[];
}
