// Life Journal types — issue #21

export type EventCategory =
  | 'career'
  | 'love'
  | 'health'
  | 'family'
  | 'travel'
  | 'finance'
  | 'education'
  | 'other';

export type EventSentiment = 'positive' | 'neutral' | 'negative';

export interface LifeEvent {
  id:        string;
  userId:    string;
  title:     string;
  category:  EventCategory;
  eventDate: string; // ISO date string "YYYY-MM-DD"
  note?:     string;
  sentiment: EventSentiment;
  createdAt: string;
}

export interface AddEventInput {
  title:     string;
  category:  EventCategory;
  eventDate: string; // "YYYY-MM-DD"
  note?:     string;
  sentiment: EventSentiment;
}

// ── AI Analysis ──────────────────────────────────────────────────────────────

export interface PatternInsight {
  category:    EventCategory;
  description: string; // e.g. "Your career shifts cluster in 庚 years"
  bestPeriod:  string; // e.g. "庚午 대운"
  watchPeriod: string; // e.g. "壬 세운"
}

export interface JournalAnalysisData {
  ok:              boolean;
  summary:         string;
  patterns:        PatternInsight[];
  dominantElement: string;  // e.g. "Metal (庚辛)"
  eventCount:      number;
  cachedAt:        string;
}
