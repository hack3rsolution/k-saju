/**
 * Four Pillars (사주팔자) calculation.
 * Month pillar uses solar-term (절기) boundaries for accuracy.
 */

import {
  STEMS, BRANCHES,
  SEXAGENARY_BASE_YEAR,
  type Stem, type Branch,
} from './constants';
import type { BirthData, FourPillars, Pillar } from './types';
import { getMonthBranchBySolarTerm } from './solar-terms';

export function sexagenaryIndex(offset: number): { stem: Stem; branch: Branch } {
  const idx = ((offset % 60) + 60) % 60;
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };
}

/** Year pillar (연주) */
export function yearPillar(year: number): Pillar {
  const offset = year - SEXAGENARY_BASE_YEAR;
  return sexagenaryIndex(offset);
}

/**
 * Month pillar (월주) — uses solar-term boundary for month branch,
 * then derives month stem from year-stem cycle.
 */
export function monthPillar(year: number, month: number, day: number): Pillar {
  const branchIdx = getMonthBranchBySolarTerm(year, month, day);
  const yearStemIdx = STEMS.indexOf(yearPillar(year).stem);

  // Month stem cycle: 寅月(branchIdx=2) start stem = (yearStemIdx%5)*2
  // Offset from 寅月(2) to current branch
  const branchOffset = ((branchIdx - 2) + 12) % 12;
  const stemIdx = ((yearStemIdx % 5) * 2 + branchOffset) % 10;

  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

/** Day pillar (일주) — uses a known reference day (2000-01-01 = 甲子, index 0) */
export function dayPillar(year: number, month: number, day: number): Pillar {
  const REF_DATE = new Date(Date.UTC(2000, 0, 1)); // 甲子 = index 0
  const target = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.round((target.getTime() - REF_DATE.getTime()) / 86_400_000);
  return sexagenaryIndex(diffDays);
}

/** Hour pillar (시주) — 2-hour intervals; requires day stem */
export function hourPillar(hour: number, dayStem: Stem): Pillar {
  // 子시 (23:00–01:00) = branch index 0
  const branchIdx = Math.floor(((hour + 1) % 24) / 2) % 12;
  const dayStemIdx = STEMS.indexOf(dayStem);
  // Hour stem cycle: day stem determines starting offset (dayStemIdx * 2 mod 10)
  const stemIdx = (dayStemIdx * 2 + branchIdx) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

export function calculateFourPillars(birth: BirthData): FourPillars {
  const yp = yearPillar(birth.year);
  const mp = monthPillar(birth.year, birth.month, birth.day);
  const dp = dayPillar(birth.year, birth.month, birth.day);
  const hp =
    birth.hour !== undefined
      ? hourPillar(birth.hour, dp.stem)
      : null;

  return { year: yp, month: mp, day: dp, hour: hp };
}
