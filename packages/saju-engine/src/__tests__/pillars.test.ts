import { calculateFourPillars, yearPillar, monthPillar, dayPillar, hourPillar } from '../pillars';
import type { BirthData } from '../types';

// ── Year Pillar ──────────────────────────────────────────

describe('yearPillar', () => {
  test('1984 = 甲子 (sexagenary base)', () => {
    const p = yearPillar(1984);
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('子');
  });

  test('2024 = 甲辰', () => {
    const p = yearPillar(2024);
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('辰');
  });

  test('2025 = 乙巳', () => {
    const p = yearPillar(2025);
    expect(p.stem).toBe('乙');
    expect(p.branch).toBe('巳');
  });

  test('2026 = 丙午', () => {
    const p = yearPillar(2026);
    expect(p.stem).toBe('丙');
    expect(p.branch).toBe('午');
  });

  test('1900 = 庚子', () => {
    const p = yearPillar(1900);
    expect(p.stem).toBe('庚');
    expect(p.branch).toBe('子');
  });

  test('2044 = 甲子 (cycle repeats every 60 years from 1984)', () => {
    const p = yearPillar(2044);
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('子');
  });
});

// ── Month Pillar ─────────────────────────────────────────

describe('monthPillar (solar-term based)', () => {
  test('after 입춘 (Feb 10, 2024) should be 寅月', () => {
    // Feb 10 is after 입춘 (Feb 4) — 寅月
    const p = monthPillar(2024, 2, 10);
    expect(p.branch).toBe('寅');
  });

  test('before 입춘 (Jan 20, 2024) should be 丑月', () => {
    const p = monthPillar(2024, 1, 20);
    expect(p.branch).toBe('丑');
  });

  test('after 경칩 (Mar 10, 2024) should be 卯月', () => {
    const p = monthPillar(2024, 3, 10);
    expect(p.branch).toBe('卯');
  });

  test('after 청명 (Apr 10, 2024) should be 辰月', () => {
    const p = monthPillar(2024, 4, 10);
    expect(p.branch).toBe('辰');
  });
});

// ── Day Pillar ───────────────────────────────────────────

describe('dayPillar', () => {
  test('2000-01-01 = 甲子 (reference)', () => {
    const p = dayPillar(2000, 1, 1);
    expect(p.stem).toBe('甲');
    expect(p.branch).toBe('子');
  });

  test('2000-01-02 = 乙丑 (next day)', () => {
    const p = dayPillar(2000, 1, 2);
    expect(p.stem).toBe('乙');
    expect(p.branch).toBe('丑');
  });

  test('1999-12-31 = 癸亥 (day before reference)', () => {
    const p = dayPillar(1999, 12, 31);
    expect(p.stem).toBe('癸');
    expect(p.branch).toBe('亥');
  });

  test('advances by 1 stem and 1 branch each day', () => {
    const p1 = dayPillar(2024, 6, 1);
    const p2 = dayPillar(2024, 6, 2);
    const { STEMS, BRANCHES } = require('../constants');
    const si1 = STEMS.indexOf(p1.stem);
    const si2 = STEMS.indexOf(p2.stem);
    const bi1 = BRANCHES.indexOf(p1.branch);
    const bi2 = BRANCHES.indexOf(p2.branch);
    expect((si2 - si1 + 10) % 10).toBe(1);
    expect((bi2 - bi1 + 12) % 12).toBe(1);
  });
});

// ── Hour Pillar ──────────────────────────────────────────

describe('hourPillar', () => {
  test('midnight (00:00) with 甲 dayStem = 子시 甲子', () => {
    // 甲(index 0) dayStem: hour stem start = 0*2=0 → 甲; 00:00 = 子(0)
    const p = hourPillar(0, '甲');
    expect(p.branch).toBe('子');
    expect(p.stem).toBe('甲');
  });

  test('14:00 (未시, index 7) with 甲 dayStem', () => {
    // branchIdx = floor((14+1)/2) % 12 = 7 → 未
    const p = hourPillar(14, '甲');
    expect(p.branch).toBe('未');
  });

  test('23:00 (子시, late night) = branch 子', () => {
    const p = hourPillar(23, '甲');
    expect(p.branch).toBe('子');
  });
});

// ── Full Four Pillars ────────────────────────────────────

describe('calculateFourPillars', () => {
  const birth: BirthData = {
    year: 1990, month: 3, day: 15, hour: 10, gender: 'M',
  };

  test('returns 4 pillars including hour', () => {
    const fp = calculateFourPillars(birth);
    expect(fp.year).toBeDefined();
    expect(fp.month).toBeDefined();
    expect(fp.day).toBeDefined();
    expect(fp.hour).not.toBeNull();
  });

  test('returns null hour pillar when hour omitted', () => {
    const fp = calculateFourPillars({ ...birth, hour: undefined });
    expect(fp.hour).toBeNull();
  });

  test('year pillar for 1990 = 庚午', () => {
    const fp = calculateFourPillars(birth);
    expect(fp.year.stem).toBe('庚');
    expect(fp.year.branch).toBe('午');
  });

  test('day pillar changes each day', () => {
    const fp1 = calculateFourPillars({ ...birth, day: 15 });
    const fp2 = calculateFourPillars({ ...birth, day: 16 });
    expect(fp1.day.stem).not.toBe(fp2.day.stem);
  });

  test('performance: completes in < 5ms', () => {
    const start = Date.now();
    calculateFourPillars(birth);
    expect(Date.now() - start).toBeLessThan(5);
  });
});
