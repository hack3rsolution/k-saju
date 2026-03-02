// ── Shared types (Deno-portable) ──────────────────────────────────────────────

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
export type RecommendationCategory = 'music' | 'book' | 'travel';
export type FiveElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface ElementBalance {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

// ── Request payload ───────────────────────────────────────────────────────────

export interface ContentRecommendationRequest {
  dayStem: string;
  elementBalance: ElementBalance;
  frame: CulturalFrame;
}

// ── Response payload ──────────────────────────────────────────────────────────

export interface RecommendationItem {
  title: string;
  description: string;
  tag: string;
}

export interface ContentRecommendationResponse {
  ok: true;
  element: FiveElement;
  music: RecommendationItem[];
  books: RecommendationItem[];
  travel: RecommendationItem[];
}

// ── Claude output ─────────────────────────────────────────────────────────────

export interface ClaudeRecommendationOutput {
  element: FiveElement;
  music: RecommendationItem[];
  books: RecommendationItem[];
  travel: RecommendationItem[];
}
