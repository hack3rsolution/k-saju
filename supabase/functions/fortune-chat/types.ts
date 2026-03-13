// ── Types for fortune-chat Edge Function ──────────────────────────────────────

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartSnapshot {
  yearPillar:   { stem: string; branch: string };
  monthPillar:  { stem: string; branch: string };
  dayPillar:    { stem: string; branch: string };
  hourPillar?:  { stem: string; branch: string };
  elementBalance: Record<string, number>;
  dayStem:      string;
}

export interface TodayReading {
  summary: string;
  details: string[];
}

export interface FortuneChatRequest {
  fortuneId:    string;          // YYYY-MM-DD
  messages:     ChatMessage[];   // full conversation history (user + assistant turns)
  frame:        CulturalFrame;
  chart:        ChartSnapshot;
  todayReading: TodayReading;
  userLanguage?: string;         // BCP-47 code e.g. 'ko', 'en', 'ja'
}

export interface FortuneChatStreamToken {
  token: string;
}

export interface FortuneChatErrorResponse {
  ok:    false;
  error: string;
}
