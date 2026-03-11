// K-Personality types — issue #TBD (v2.4.0)
//
// NOTE: `KElement` uses lowercase English strings ('wood' | 'fire' | ...)
// to avoid collision with `@k-saju/saju-engine`'s `FiveElement` which uses
// Korean hanja characters (木 | 火 | 土 | 金 | 水).

/** Lowercase English five-element identifier used throughout K-Personality. */
export type KElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** Ratio breakdown of all five elements — values sum to 100, 1 decimal place. */
export interface FiveElementRatio {
  wood:  number;
  fire:  number;
  earth: number;
  metal: number;
  water: number;
}

/** Four Sasang constitutional types (사상체질). */
export type SasangType = 'taeyang' | 'soyang' | 'taeeum' | 'soeum';

// ── Free tier result ──────────────────────────────────────────────────────────

export interface KPersonalityFree {
  dominantElement: KElement;
  weakestElement:  KElement;
  elementRatio:    FiveElementRatio;
  sasangType:      SasangType;
  typeName:        string;    // e.g. "Visionary Pioneer"
  typeNameKo:      string;    // e.g. "목양 선구자"
  keywords:        string[];  // 3 items
  summaryShort:    string;    // ≤ 120 chars
}

// ── Premium tier result ───────────────────────────────────────────────────────

export interface KPersonalityPremium extends KPersonalityFree {
  summaryFull:        string;       // 500–800 chars
  strengths:          string[];     // 3 items
  growthAreas:        string[];     // 2 items
  careerFit:          string[];     // 5 items
  compatibleTypes:    SasangType[];
  monthlyEnergyFlow:  string;
}

// ── DB record (matches k_personality_readings table) ─────────────────────────

export interface KPersonalityRecord {
  id:                  string;
  user_id:             string;
  element_ratio:       FiveElementRatio;
  sasang_type:         SasangType;
  type_name:           string;
  type_name_ko:        string;
  keywords:            string[];
  summary_short:       string;
  summary_full?:       string;
  strengths?:          string[];
  growth_areas?:       string[];
  career_fit?:         string[];
  compatible_types?:   SasangType[];
  monthly_energy_flow?: string;
  language:            string;
  share_enabled:       boolean;
  created_at:          string;
  updated_at:          string;
}
