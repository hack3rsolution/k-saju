// ── Shared types (Deno-portable) ──────────────────────────────────────────────

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
export type AddonReportType =
  | 'compatibility'
  | 'career'
  | 'daewoon_full'
  | 'name_analysis';

export interface Pillar {
  stem: string;
  branch: string;
}

export interface ChartPayload {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
  elementBalance: {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
  };
  dayStem: string;
  daewoonList: {
    index: number;
    startAge: number;
    pillar: Pillar;
    element: string;
  }[];
}

// ── Request payload ───────────────────────────────────────────────────────────

export interface AddonReportRequest {
  reportType: AddonReportType;
  chart: ChartPayload;
  frame: CulturalFrame;
  /** Birth year for age calculations */
  birthYear?: number;
  /** Compatibility only — partner's pre-calculated chart */
  partnerChart?: ChartPayload;
  partnerBirthYear?: number;
  /** Name analysis only — the name to analyze (Korean/Chinese) */
  name?: string;
}

// ── Response payload ──────────────────────────────────────────────────────────

export interface ReportSection {
  heading: string;
  content: string;
}

export interface AddonReport {
  title: string;
  overview: string;
  sections: ReportSection[];
}

export interface AddonReportResponse {
  ok: true;
  report: AddonReport;
}

// ── Claude output ─────────────────────────────────────────────────────────────

export type ClaudeReportOutput = AddonReport;
