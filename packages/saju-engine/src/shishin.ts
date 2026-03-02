/**
 * 십신 (十神) — Ten Gods / Ten Deities
 *
 * Determines the relationship between the 일간 (Day Stem = self)
 * and any other stem/branch based on element generation/control cycles.
 *
 * Classification:
 * - 비겁 (Peers & Competitors): same element
 *   - 비견 (比肩, bǐjiān): same polarity
 *   - 겁재 (劫財, jiécái): opposite polarity
 * - 식상 (Output): self generates other
 *   - 식신 (食神, shíshén): same polarity as self
 *   - 상관 (傷官, shāngguān): opposite polarity
 * - 재성 (Wealth): self controls other
 *   - 편재 (偏財, piāncái): same polarity as self
 *   - 정재 (正財, zhèngcái): opposite polarity
 * - 관성 (Officer): other controls self
 *   - 편관 (偏官, piānguān): same polarity as self
 *   - 정관 (正官, zhèngguān): opposite polarity
 * - 인성 (Resource): other generates self
 *   - 편인 (偏印, piānyìn): same polarity as self
 *   - 정인 (正印, zhèngyìn): opposite polarity
 */

import { STEM_ELEMENT, STEM_POLARITY, FIVE_ELEMENTS, type Stem } from './constants';
import type { FiveElement } from './constants';

export type ShiShin =
  | '비견' | '겁재'   // Peers
  | '식신' | '상관'   // Output
  | '편재' | '정재'   // Wealth
  | '편관' | '정관'   // Officer
  | '편인' | '정인';  // Resource

/** Five-element generating cycle index */
const ELEMENT_ORDER: FiveElement[] = ['木', '火', '土', '金', '水'];

function elementIndex(e: FiveElement): number {
  return ELEMENT_ORDER.indexOf(e);
}

/** Returns the element that `e` generates (next in generating cycle) */
function generates(e: FiveElement): FiveElement {
  return ELEMENT_ORDER[(elementIndex(e) + 1) % 5];
}

/** Returns the element that `e` controls (克, two steps ahead) */
function controls(e: FiveElement): FiveElement {
  return ELEMENT_ORDER[(elementIndex(e) + 2) % 5];
}

/**
 * Calculates the 십신 relationship from the perspective of `dayStem`.
 * @param dayStem  — 일간 (self)
 * @param otherStem — the stem to classify
 */
export function getShiShin(dayStem: Stem, otherStem: Stem): ShiShin {
  const selfEl   = STEM_ELEMENT[dayStem];
  const otherEl  = STEM_ELEMENT[otherStem];
  const selfPol  = STEM_POLARITY[dayStem];
  const otherPol = STEM_POLARITY[otherStem];
  const samePolarity = selfPol === otherPol;

  // 비겁: same element
  if (selfEl === otherEl) return samePolarity ? '비견' : '겁재';

  // 식상: self generates other
  if (generates(selfEl) === otherEl) return samePolarity ? '식신' : '상관';

  // 재성: self controls other
  if (controls(selfEl) === otherEl) return samePolarity ? '편재' : '정재';

  // 관성: other controls self (other generates what controls self → other controls self when otherEl controls selfEl)
  if (controls(otherEl) === selfEl) return samePolarity ? '편관' : '정관';

  // 인성: other generates self
  if (generates(otherEl) === selfEl) return samePolarity ? '편인' : '정인';

  // Fallback (shouldn't happen with valid stems)
  throw new Error(`Cannot determine ShiShin for dayStem=${dayStem} otherStem=${otherStem}`);
}
