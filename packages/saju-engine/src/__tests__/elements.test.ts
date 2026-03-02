import { calculateElementBalance } from '../elements';
import { calculateFourPillars } from '../pillars';
import type { BirthData } from '../types';

describe('calculateElementBalance', () => {
  const birth: BirthData = { year: 2000, month: 1, day: 1, hour: 12, gender: 'M' };

  test('returns all 5 elements', () => {
    const fp = calculateFourPillars(birth);
    const balance = calculateElementBalance(fp);
    expect(Object.keys(balance)).toEqual(['Wood', 'Fire', 'Earth', 'Metal', 'Water']);
  });

  test('total count = 8 when hour pillar present (4 pillars × 2 chars)', () => {
    const fp = calculateFourPillars(birth);
    const balance = calculateElementBalance(fp);
    const total = Object.values(balance).reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
  });

  test('total count = 6 when no hour pillar (3 pillars × 2 chars)', () => {
    const fp = calculateFourPillars({ ...birth, hour: undefined });
    const balance = calculateElementBalance(fp);
    const total = Object.values(balance).reduce((a, b) => a + b, 0);
    expect(total).toBe(6);
  });

  test('all element counts are non-negative', () => {
    const fp = calculateFourPillars(birth);
    const balance = calculateElementBalance(fp);
    Object.values(balance).forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});
