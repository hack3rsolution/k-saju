import { calculateDaewoon } from '../daewoon';
import type { BirthData } from '../types';

describe('calculateDaewoon (대운)', () => {
  const maleBirth: BirthData = { year: 1990, month: 3, day: 15, gender: 'M' };
  const femaleBirth: BirthData = { year: 1990, month: 3, day: 15, gender: 'F' };

  test('returns 8 periods by default', () => {
    const periods = calculateDaewoon(maleBirth);
    expect(periods).toHaveLength(8);
  });

  test('respects count parameter', () => {
    const periods = calculateDaewoon(maleBirth, 5);
    expect(periods).toHaveLength(5);
  });

  test('each period has a 10-year interval', () => {
    const periods = calculateDaewoon(maleBirth);
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i].startAge - periods[i - 1].startAge).toBe(10);
    }
  });

  test('periods have valid stem and branch', () => {
    const { STEMS, BRANCHES } = require('../constants');
    const periods = calculateDaewoon(maleBirth);
    periods.forEach((p) => {
      expect(STEMS).toContain(p.pillar.stem);
      expect(BRANCHES).toContain(p.pillar.branch);
    });
  });

  test('male (양년 + 남성) and female (양년 + 여성) have different direction pillars', () => {
    const male = calculateDaewoon(maleBirth);
    const female = calculateDaewoon(femaleBirth);
    // 庚午年 1990 = Yang year. Male = forward, Female = backward
    expect(male[0].pillar.stem).not.toBe(female[0].pillar.stem);
  });

  test('each period has a valid FiveElement', () => {
    const validElements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const periods = calculateDaewoon(maleBirth);
    periods.forEach((p) => {
      expect(validElements).toContain(p.element);
    });
  });

  test('index is sequential starting from 0', () => {
    const periods = calculateDaewoon(maleBirth);
    periods.forEach((p, i) => expect(p.index).toBe(i));
  });
});
