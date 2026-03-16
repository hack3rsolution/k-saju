/**
 * Boundary-case tests for the astronomical solar-term calculation.
 *
 * Tests focus on:
 * 1. Day before / day of / day after each term (branch transition)
 * 2. Hour-level precision on the exact day of a term
 * 3. The previously broken January 子月↔丑月 boundary
 * 4. Year-boundary cases (late December / early January)
 *
 * Reference UTC times used for known terms:
 *   입춘 2024 : Feb  4, 17:26 UTC  →  day-level: Feb 4 (after midnight, before term)
 *   경칩 2024 : Mar  5, 05:22 UTC  →  day-level: Mar 5 (after midnight, before term)
 *   소한 2025 : Jan  5, 23:31 UTC  →  day-level: Jan 5 (after midnight, before term)
 *   대설 2024 : Dec  7, 09:17 UTC  →  day-level: Dec 7
 */

import { getMonthBranchBySolarTerm, getSolarTermDate } from '../solar-terms';
import { monthPillar } from '../pillars';

// ── Branch index helpers ──────────────────────────────────────────────────────
const 子 = 0, 丑 = 1, 寅 = 2, 卯 = 3, 辰 = 4, 巳 = 5;
const 午 = 6, 未 = 7, 申 = 8, 酉 = 9, 戌 = 10, 亥 = 11;

// ── 입춘 2024 boundary (Feb 4) ────────────────────────────────────────────────
describe('입춘 2024 boundary', () => {
  test('Feb 3 (day before 입춘) → 丑月', () => {
    expect(getMonthBranchBySolarTerm(2024, 2, 3)).toBe(丑);
  });

  test('Feb 5 (day after 입춘) → 寅月', () => {
    expect(getMonthBranchBySolarTerm(2024, 2, 5)).toBe(寅);
  });

  // 입춘 2024 is at 17:26 UTC on Feb 4
  test('Feb 4 at hour=0 UTC (before 입춘) → 丑月', () => {
    expect(getMonthBranchBySolarTerm(2024, 2, 4, 0)).toBe(丑);
  });

  test('Feb 4 at hour=23 UTC (after 입춘) → 寅月', () => {
    expect(getMonthBranchBySolarTerm(2024, 2, 4, 23)).toBe(寅);
  });
});

// ── 경칩 2024 boundary (Mar 5) ────────────────────────────────────────────────
describe('경칩 2024 boundary', () => {
  test('Mar 4 (day before 경칩) → 寅月', () => {
    expect(getMonthBranchBySolarTerm(2024, 3, 4)).toBe(寅);
  });

  test('Mar 6 (day after 경칩) → 卯月', () => {
    expect(getMonthBranchBySolarTerm(2024, 3, 6)).toBe(卯);
  });
});

// ── 청명 2024 boundary (Apr 4) ────────────────────────────────────────────────
describe('청명 2024 boundary', () => {
  test('Apr 3 (day before 청명) → 卯月', () => {
    expect(getMonthBranchBySolarTerm(2024, 4, 3)).toBe(卯);
  });

  test('Apr 5 (day after 청명) → 辰月', () => {
    expect(getMonthBranchBySolarTerm(2024, 4, 5)).toBe(辰);
  });
});

// ── 소한 2025 boundary (Jan 5) — previously broken ───────────────────────────
describe('소한 2025 boundary — Jan 子月↔丑月 (was buggy in old code)', () => {
  // 대설 2024 was Dec 7 → opens 子月
  // 소한 2025 is Jan 5  → opens 丑月

  test('Jan 3, 2025 (before 소한, after 대설 2024) → 子月', () => {
    expect(getMonthBranchBySolarTerm(2025, 1, 3)).toBe(子);
  });

  test('Jan 7, 2025 (after 소한) → 丑月', () => {
    expect(getMonthBranchBySolarTerm(2025, 1, 7)).toBe(丑);
  });

  // Pillar-level check
  test('monthPillar: 2025-01-03 branch = 子', () => {
    expect(monthPillar(2025, 1, 3).branch).toBe('子');
  });

  test('monthPillar: 2025-01-07 branch = 丑', () => {
    expect(monthPillar(2025, 1, 7).branch).toBe('丑');
  });
});

// ── 대설 2024 boundary (Dec 7) ────────────────────────────────────────────────
describe('대설 2024 boundary', () => {
  test('Dec 6, 2024 (day before 대설) → 亥月', () => {
    expect(getMonthBranchBySolarTerm(2024, 12, 6)).toBe(亥);
  });

  test('Dec 9, 2024 (day after 대설) → 子月', () => {
    expect(getMonthBranchBySolarTerm(2024, 12, 9)).toBe(子);
  });

  test('Dec 30, 2024 (late December, after 대설) → 子月', () => {
    expect(getMonthBranchBySolarTerm(2024, 12, 30)).toBe(子);
  });
});

// ── 입동 / 소설 season check ──────────────────────────────────────────────────
describe('亥月 range (입동 to 대설)', () => {
  test('Nov 10, 2024 (after 입동 Nov 7) → 亥月', () => {
    expect(getMonthBranchBySolarTerm(2024, 11, 10)).toBe(亥);
  });

  test('Nov 6, 2024 (before 입동) → 戌月', () => {
    expect(getMonthBranchBySolarTerm(2024, 11, 6)).toBe(戌);
  });
});

// ── getSolarTermDate precision ────────────────────────────────────────────────
describe('getSolarTermDate', () => {
  test('입춘 2024 (index 0) falls on Feb 4', () => {
    const d = getSolarTermDate(2024, 0);
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(1); // 0-based: January=0, February=1
    expect(d.getUTCDate()).toBe(4);
  });

  test('경칩 2024 (index 2) falls on Mar 5', () => {
    const d = getSolarTermDate(2024, 2);
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(2); // March
    expect(d.getUTCDate()).toBe(5);
  });

  test('소한 2024-cycle (index 22) falls in Jan 2025', () => {
    const d = getSolarTermDate(2024, 22);
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(0); // January
    expect(d.getUTCDate()).toBe(5);
  });

  test('getSolarTermDate returns a Date instance', () => {
    expect(getSolarTermDate(2024, 0)).toBeInstanceOf(Date);
  });

  test('입춘 2025 (index 0) falls on Feb 3 or 4', () => {
    const d = getSolarTermDate(2025, 0);
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(1);
    expect([3, 4]).toContain(d.getUTCDate());
  });
});

// ── Consistency: previous-year and current-year lookups agree ────────────────
describe('Year-boundary consistency', () => {
  test('2025-Jan-20 and 2024-cycle agree on 丑月', () => {
    // Jan 20 is well after 소한 (Jan 5) → 丑月
    expect(getMonthBranchBySolarTerm(2025, 1, 20)).toBe(丑);
  });

  test('2024-Dec-31 → 子月 (after 대설 Dec 7, before 소한 Jan 5)', () => {
    expect(getMonthBranchBySolarTerm(2024, 12, 31)).toBe(子);
  });

  test('2025-Feb-2 → 丑月 (before 입춘 Feb 3/4)', () => {
    expect(getMonthBranchBySolarTerm(2025, 2, 2)).toBe(丑);
  });
});
