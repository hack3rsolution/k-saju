import { STEM_ELEMENT, BRANCH_ELEMENT } from './constants';
import type { FourPillars, ElementBalance } from './types';

export function calculateElementBalance(pillars: FourPillars): ElementBalance {
  const balance: ElementBalance = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  const elementMap: Record<string, keyof ElementBalance> = {
    木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
  };

  const allPillars = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);

  for (const pillar of allPillars) {
    if (!pillar) continue;
    const stemEl = elementMap[STEM_ELEMENT[pillar.stem]];
    const branchEl = elementMap[BRANCH_ELEMENT[pillar.branch]];
    balance[stemEl]++;
    balance[branchEl]++;
  }

  return balance;
}
