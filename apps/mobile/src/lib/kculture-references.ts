/**
 * K-Culture reference layer density settings.
 *
 * Determines how much K-Culture context (K-drama, K-pop, Korean seasonal
 * concepts, hanbok, etc.) is woven into AI reading narratives.
 *
 * Densities:
 *   'high'   — Rich K-Culture references; market is highly K-Culture receptive
 *   'medium' — Moderate references; familiar but not dominant
 *   'low'    — Minimal references; prefer universal/neutral framing
 */

export type KCultureDensity = 'high' | 'medium' | 'low';

export const KCULTURE_DENSITY: Record<string, KCultureDensity> = {
  // East Asia — highest K-Culture affinity
  ko:       'high',
  'zh-Hans': 'high',
  'zh-Hant': 'high',
  ja:       'high',

  // Southeast Asia — very high K-Wave penetration
  th:       'high',
  id:       'high',
  vi:       'high',

  // South Asia
  hi:       'medium',

  // Western / Europe — K-Culture interest but not dominant
  en:       'medium',
  fr:       'medium',
  de:       'medium',
  es:       'medium',
  'pt-BR':  'medium',

  // Middle East — growing but lower K-Culture saturation
  ar:       'low',
};

/**
 * Returns the K-Culture reference density for a given language code.
 * Defaults to 'medium' for unknown codes.
 */
export function getKCultureDensity(languageCode: string): KCultureDensity {
  return KCULTURE_DENSITY[languageCode] ?? 'medium';
}

/**
 * System prompt addendum for the Claude API based on K-Culture density.
 * Append this to any cultural frame system prompt to tune narrative flavor.
 */
export function buildKCultureInstruction(languageCode: string): string {
  const density = getKCultureDensity(languageCode);

  switch (density) {
    case 'high':
      return `\n\nK-CULTURE LAYER: Freely incorporate Korean cultural references where natural — seasons (봄/여름/가을/겨울), concepts like 눈치 (nunchi), 한 (han), 빨리빨리 (ppalli-ppalli) energy, K-drama emotional arcs, and traditional Korean aesthetics. These will resonate strongly with the user.`;

    case 'medium':
      return `\n\nK-CULTURE LAYER: You may lightly reference Korean cultural concepts when they add depth (e.g., "like a K-drama turning point" or "the Korean idea of 운명 — destiny"). Keep references accessible and explained briefly.`;

    case 'low':
      return `\n\nK-CULTURE LAYER: Use universal, culturally neutral language. Avoid Korean-specific idioms or pop-culture references. Focus on the elemental and astrological aspects of the reading.`;
  }
}
