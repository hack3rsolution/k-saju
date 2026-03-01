// ── Types for relationship-fortune Edge Function ──────────────────────────────

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
export type RelationshipType = 'romantic' | 'friend' | 'family' | 'colleague' | 'other';
export type CompatibilityStatus = 'good' | 'neutral' | 'caution';

export interface ChartSnapshot {
  yearPillar:    { stem: string; branch: string };
  monthPillar:   { stem: string; branch: string };
  dayPillar:     { stem: string; branch: string };
  hourPillar?:   { stem: string; branch: string };
  elementBalance: Record<string, number>;
  dayStem:       string;
}

export interface BirthDataInput {
  year:  number;
  month: number;
  day:   number;
  hour?: number;
  gender: 'M' | 'F';
}

export interface RelationshipFortuneRequest {
  relationshipId:   string;
  ownerChart:       ChartSnapshot;
  partnerBirth:     BirthDataInput;
  partnerName:      string;
  relationshipType: RelationshipType;
  frame:            CulturalFrame;
  refMonth:         string;   // YYYY-MM
}

export interface RelationshipFortuneResponse {
  ok:                 true;
  compatibilityScore: number;            // 0–100
  compatibilityStatus: CompatibilityStatus;
  summary:            string;
  monthlyFlow:        string;            // this month's energy flow
  strengths:          string[];          // 2–3 strong points
  cautions:           string[];          // 1–2 caution points
  elementSynergy:     Record<string, number>; // owner + partner element counts
}
