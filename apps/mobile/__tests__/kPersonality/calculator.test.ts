/**
 * calculator.test.ts — K-Personality 오행 비율 계산 단위 테스트
 *
 * 검증 항목:
 *   - 木 dominant 사주 → taeyang + wood dominant
 *   - 水 dominant 사주 → soeum + water dominant
 *   - ratio 합계 = 100 (±0.1 허용)
 *   - earth + metal ≥ 50% → taeeum (단독 dominant가 water여도 override)
 *   - hour=null (6자 사주) 정상 처리
 *   - 동점 오행 처리 시 에러 없음
 *   - findDominantElement / findWeakestElement 경계값
 */

import type { FourPillars } from '@k-saju/saju-engine';
import {
  calculateElementRatio,
  findDominantElement,
  findWeakestElement,
  determineSasangType,
  buildKPersonalityInput,
} from '../../src/features/k-personality/engine/calculator';

// ── 테스트용 FourPillars 픽스처 ───────────────────────────────────────────────

/** 木 100% — 甲乙 천간 + 寅卯 지지 */
const WOOD_PILLARS: FourPillars = {
  year:  { stem: '甲', branch: '寅' }, // wood + wood(0.7)
  month: { stem: '乙', branch: '卯' }, // wood + wood(1.0)
  day:   { stem: '甲', branch: '寅' }, // wood + wood(0.7)
  hour:  { stem: '乙', branch: '卯' }, // wood + wood(1.0)
};

/** 水 100% — 壬癸 천간 + 子亥 지지 */
const WATER_PILLARS: FourPillars = {
  year:  { stem: '壬', branch: '子' }, // water + water(1.0)
  month: { stem: '癸', branch: '亥' }, // water + water(0.8)
  day:   { stem: '壬', branch: '子' }, // water + water(1.0)
  hour:  { stem: '癸', branch: '亥' }, // water + water(0.8)
};

/**
 * earth+metal ≥ 50% override 케이스
 * — dominant는 water(37.7%)이지만 earth+metal 합이 62.3%
 * year={壬·子}, month={戊·丑}, day={庚·申}  (hour=null, 3기둥)
 *
 * 점수:
 *   water: 1.0(壬) + 1.0(子) = 2.0
 *   earth: 1.0(戊) + 0.6(丑) = 1.6
 *   metal: 1.0(庚) + 0.7(申) = 1.7
 *   total = 5.3
 *   water≈37.7%, earth≈30.2%, metal≈32.1% → earth+metal≈62.3% ≥ 50
 */
const EARTH_METAL_OVERRIDE_PILLARS: FourPillars = {
  year:  { stem: '壬', branch: '子' },
  month: { stem: '戊', branch: '丑' },
  day:   { stem: '庚', branch: '申' },
  hour:  null,
};

/** 火 dominant — 丙丁 천간 + 巳午 지지 */
const FIRE_PILLARS: FourPillars = {
  year:  { stem: '丙', branch: '巳' }, // fire + fire(0.7)
  month: { stem: '丁', branch: '午' }, // fire + fire(0.8)
  day:   { stem: '丙', branch: '巳' }, // fire + fire(0.7)
  hour:  { stem: '丁', branch: '午' }, // fire + fire(0.8)
};

/** 混合 — 각 오행이 골고루 섞인 케이스 */
const MIXED_PILLARS: FourPillars = {
  year:  { stem: '甲', branch: '子' }, // wood, water
  month: { stem: '丙', branch: '卯' }, // fire, wood
  day:   { stem: '戊', branch: '午' }, // earth, fire
  hour:  { stem: '庚', branch: '酉' }, // metal, metal
};

// ── calculateElementRatio ─────────────────────────────────────────────────────

describe('calculateElementRatio', () => {
  test('木 dominant 사주 — wood 비율이 가장 높음', () => {
    const ratio = calculateElementRatio(WOOD_PILLARS);
    expect(ratio.wood).toBeGreaterThan(ratio.fire);
    expect(ratio.wood).toBeGreaterThan(ratio.earth);
    expect(ratio.wood).toBeGreaterThan(ratio.metal);
    expect(ratio.wood).toBeGreaterThan(ratio.water);
  });

  test('水 dominant 사주 — water 비율이 가장 높음', () => {
    const ratio = calculateElementRatio(WATER_PILLARS);
    expect(ratio.water).toBeGreaterThan(ratio.wood);
    expect(ratio.water).toBeGreaterThan(ratio.fire);
    expect(ratio.water).toBeGreaterThan(ratio.earth);
    expect(ratio.water).toBeGreaterThan(ratio.metal);
  });

  test('ratio 합계 = 100 (±0.1)', () => {
    for (const pillars of [WOOD_PILLARS, WATER_PILLARS, FIRE_PILLARS, MIXED_PILLARS, EARTH_METAL_OVERRIDE_PILLARS]) {
      const ratio = calculateElementRatio(pillars);
      const sum = ratio.wood + ratio.fire + ratio.earth + ratio.metal + ratio.water;
      expect(sum).toBeCloseTo(100, 1);
    }
  });

  test('hour=null (3기둥 6자) — 에러 없이 정상 계산', () => {
    const ratio = calculateElementRatio(EARTH_METAL_OVERRIDE_PILLARS);
    const sum = ratio.wood + ratio.fire + ratio.earth + ratio.metal + ratio.water;
    expect(sum).toBeCloseTo(100, 1);
  });

  test('모든 비율이 0 이상', () => {
    const ratio = calculateElementRatio(MIXED_PILLARS);
    expect(ratio.wood).toBeGreaterThanOrEqual(0);
    expect(ratio.fire).toBeGreaterThanOrEqual(0);
    expect(ratio.earth).toBeGreaterThanOrEqual(0);
    expect(ratio.metal).toBeGreaterThanOrEqual(0);
    expect(ratio.water).toBeGreaterThanOrEqual(0);
  });

  test('소수점 1자리 정밀도 (최대 1 decimal)', () => {
    const ratio = calculateElementRatio(MIXED_PILLARS);
    for (const val of Object.values(ratio)) {
      expect(Math.round(val * 10) / 10).toBe(val);
    }
  });

  test('순수 火 사주 — fire=100, 나머지=0', () => {
    const ratio = calculateElementRatio(FIRE_PILLARS);
    expect(ratio.fire).toBe(100);
    expect(ratio.wood).toBe(0);
    expect(ratio.earth).toBe(0);
    expect(ratio.metal).toBe(0);
    expect(ratio.water).toBe(0);
  });
});

// ── findDominantElement ───────────────────────────────────────────────────────

describe('findDominantElement', () => {
  test('木 dominant 사주 → wood', () => {
    expect(findDominantElement(calculateElementRatio(WOOD_PILLARS))).toBe('wood');
  });

  test('水 dominant 사주 → water', () => {
    expect(findDominantElement(calculateElementRatio(WATER_PILLARS))).toBe('water');
  });

  test('直接 ratio 주입 — metal이 최고값 → metal', () => {
    const ratio = { wood: 10, fire: 15, earth: 20, metal: 45, water: 10 };
    expect(findDominantElement(ratio)).toBe('metal');
  });

  test('동점 처리 — 에러 없이 K_ELEMENTS 순서 기준으로 반환', () => {
    const ratio = { wood: 25, fire: 25, earth: 25, metal: 25, water: 0 };
    expect(() => findDominantElement(ratio)).not.toThrow();
    // wood가 K_ELEMENTS 배열 첫 번째이므로 동점 시 wood 반환
    expect(findDominantElement(ratio)).toBe('wood');
  });
});

// ── findWeakestElement ────────────────────────────────────────────────────────

describe('findWeakestElement', () => {
  test('木 100% 사주 → fire/earth/metal/water 중 하나 (모두 0)', () => {
    const weakest = findWeakestElement(calculateElementRatio(WOOD_PILLARS));
    expect(['fire', 'earth', 'metal', 'water']).toContain(weakest);
  });

  test('直接 ratio 주입 — fire가 최솟값 → fire', () => {
    const ratio = { wood: 30, fire: 5, earth: 25, metal: 25, water: 15 };
    expect(findWeakestElement(ratio)).toBe('fire');
  });

  test('동점 처리 — 에러 없이 반환', () => {
    const ratio = { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 };
    expect(() => findWeakestElement(ratio)).not.toThrow();
  });
});

// ── determineSasangType ───────────────────────────────────────────────────────

describe('determineSasangType', () => {
  test('木 dominant → taeyang', () => {
    expect(determineSasangType(calculateElementRatio(WOOD_PILLARS))).toBe('taeyang');
  });

  test('水 dominant → soeum', () => {
    expect(determineSasangType(calculateElementRatio(WATER_PILLARS))).toBe('soeum');
  });

  test('火 dominant → soyang', () => {
    expect(determineSasangType(calculateElementRatio(FIRE_PILLARS))).toBe('soyang');
  });

  test('earth+metal ≥ 50% → taeeum (water dominant 케이스)', () => {
    // water가 dominant이지만 earth+metal 합이 62.3% → taeeum override
    expect(determineSasangType(calculateElementRatio(EARTH_METAL_OVERRIDE_PILLARS))).toBe('taeeum');
  });

  test('直接 ratio — earth+metal 정확히 50% → taeeum', () => {
    const ratio = { wood: 20, fire: 30, earth: 25, metal: 25, water: 0 };
    expect(determineSasangType(ratio)).toBe('taeeum');
  });

  test('直接 ratio — earth+metal 49.9% → dominant 기준 적용', () => {
    const ratio = { wood: 50.1, fire: 0, earth: 25, metal: 24.9, water: 0 };
    expect(determineSasangType(ratio)).toBe('taeyang'); // wood dominant
  });
});

// ── buildKPersonalityInput ────────────────────────────────────────────────────

describe('buildKPersonalityInput', () => {
  test('반환값에 ratio·sasangType·dominantElement·weakestElement 모두 포함', () => {
    const result = buildKPersonalityInput(MIXED_PILLARS);
    expect(result).toHaveProperty('ratio');
    expect(result).toHaveProperty('sasangType');
    expect(result).toHaveProperty('dominantElement');
    expect(result).toHaveProperty('weakestElement');
  });

  test('木 사주 — 통합 결과 일관성', () => {
    const result = buildKPersonalityInput(WOOD_PILLARS);
    expect(result.dominantElement).toBe('wood');
    expect(result.sasangType).toBe('taeyang');
    expect(result.ratio.wood).toBe(100);
  });

  test('水 사주 — 통합 결과 일관성', () => {
    const result = buildKPersonalityInput(WATER_PILLARS);
    expect(result.dominantElement).toBe('water');
    expect(result.sasangType).toBe('soeum');
  });

  test('hour=null 사주 — 에러 없이 완전한 결과 반환', () => {
    expect(() => buildKPersonalityInput(EARTH_METAL_OVERRIDE_PILLARS)).not.toThrow();
    const result = buildKPersonalityInput(EARTH_METAL_OVERRIDE_PILLARS);
    expect(result.sasangType).toBe('taeeum');
  });

  test('ratio 합계 = 100 (±0.1)', () => {
    const { ratio } = buildKPersonalityInput(MIXED_PILLARS);
    const sum = ratio.wood + ratio.fire + ratio.earth + ratio.metal + ratio.water;
    expect(sum).toBeCloseTo(100, 1);
  });
});
