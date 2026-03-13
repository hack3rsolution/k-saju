// journal-analysis Edge Function types

export type EventCategory =
  | 'career' | 'love' | 'health' | 'family'
  | 'travel' | 'finance' | 'education' | 'other';

export type EventSentiment = 'positive' | 'neutral' | 'negative';

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';

export interface LifeEvent {
  id:        string;
  title:     string;
  category:  EventCategory;
  eventDate: string; // "YYYY-MM-DD"
  note?:     string;
  sentiment: EventSentiment;
}

export interface SajuChart {
  yearPillar:     { stem: string; branch: string };
  monthPillar:    { stem: string; branch: string };
  dayPillar:      { stem: string; branch: string };
  hourPillar?:    { stem: string; branch: string };
  elementBalance: Record<string, number>;
  dayStem:        string;
}

export interface JournalAnalysisRequest {
  events:        LifeEvent[];
  chart:         SajuChart;
  frame:         CulturalFrame;
  userLanguage?: string;  // BCP-47 code e.g. 'ko', 'en', 'ja'
}

export interface PatternInsight {
  category:    EventCategory;
  description: string;
  bestPeriod:  string;
  watchPeriod: string;
}

export interface JournalAnalysisResponse {
  ok:              boolean;
  summary:         string;
  patterns:        PatternInsight[];
  dominantElement: string;
  eventCount:      number;
  cachedAt:        string;
}
