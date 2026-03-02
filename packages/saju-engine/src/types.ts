import type { Stem, Branch, FiveElement } from './constants';

export interface Pillar {
  stem: Stem;
  branch: Branch;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // null when birth time is unknown
}

export interface ElementBalance {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

export interface SajuChart {
  pillars: FourPillars;
  elements: ElementBalance;
  dayStem: Stem;         // 일간 — the "self" element
  dayElement: FiveElement;
}

export interface BirthData {
  year: number;
  month: number;       // 1–12
  day: number;         // 1–31
  hour?: number;       // 0–23, optional
  minute?: number;     // 0–59, optional
  gender: 'M' | 'F';
}

export interface DaewoonPeriod {
  index: number;       // 0-based (0 = first 대운 period)
  startAge: number;
  pillar: Pillar;
  element: FiveElement;
}

export type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';
