/**
 * 대운 (大運) — 10-year Major Luck Cycle calculation.
 *
 * Direction:
 *  - Yang year + Male or Yin year + Female → forward (순행)
 *  - Yang year + Female or Yin year + Male → backward (역행)
 *
 * Start age is determined by counting days to the nearest solar term
 * boundary divided by 3 (≈ 1 day = 4 months). This file uses a simplified
 * approximation; replace with a full solar-term table for production.
 */

import { STEMS, BRANCHES, STEM_POLARITY, BRANCH_ELEMENT } from './constants';
import type { Stem, Branch } from './constants';
import type { BirthData, DaewoonPeriod, FourPillars } from './types';
import { calculateFourPillars } from './pillars';

function nextSexagenary(stem: Stem, branch: Branch, forward: boolean): { stem: Stem; branch: Branch } {
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  const step = forward ? 1 : -1;
  return {
    stem: STEMS[((si + step) % 10 + 10) % 10],
    branch: BRANCHES[((bi + step) % 12 + 12) % 12],
  };
}

export function calculateDaewoon(birth: BirthData, count = 8): DaewoonPeriod[] {
  const pillars: FourPillars = calculateFourPillars(birth);
  const yearStemIdx = STEMS.indexOf(pillars.year.stem);
  const yearPolarity = STEM_POLARITY[pillars.year.stem];

  // Forward = (yang year & male) OR (yin year & female)
  const forward =
    (yearPolarity === 'yang' && birth.gender === 'M') ||
    (yearPolarity === 'yin' && birth.gender === 'F');

  // Simplified start age: use 8 as a placeholder; production uses solar-term delta
  const startAge = 8;

  const periods: DaewoonPeriod[] = [];
  let { stem, branch } = pillars.month;

  for (let i = 0; i < count; i++) {
    ({ stem, branch } = nextSexagenary(stem, branch, forward));
    periods.push({
      index: i,
      startAge: startAge + i * 10,
      pillar: { stem, branch },
      element: BRANCH_ELEMENT[branch],
    });
  }

  return periods;
}
