/**
 * elementMapping.test.ts — K-Personality 오행 매핑 단위 테스트
 *
 * 검증 항목:
 *   - 천간 10개 → KElement 매핑 완전성 및 정확성
 *   - 지지 12개 → KElement 매핑 완전성 및 정확성
 *   - 지장간 weight 범위 (0 < weight ≤ 1.0)
 *   - SASANG_MAPPING 모든 값이 SasangType에 속하는지
 *   - SASANG_NAMES 모든 항목이 ko/en 문자열을 가지는지
 */

import { STEMS, BRANCHES } from '@k-saju/saju-engine';
import {
  HEAVENLY_STEMS_ELEMENT,
  EARTHLY_BRANCHES_ELEMENT,
  SASANG_MAPPING,
  SASANG_NAMES,
} from '../../src/features/k-personality/engine/elementMapping';
import type { KElement, SasangType } from '../../src/types/kPersonality';

const K_ELEMENTS: KElement[]   = ['wood', 'fire', 'earth', 'metal', 'water'];
const SASANG_TYPES: SasangType[] = ['taeyang', 'soyang', 'taeeum', 'soeum'];

// ── 천간(天干) 매핑 ────────────────────────────────────────────────────────────

describe('HEAVENLY_STEMS_ELEMENT', () => {
  test('10개 천간 모두 매핑됨', () => {
    expect(Object.keys(HEAVENLY_STEMS_ELEMENT)).toHaveLength(10);
    STEMS.forEach((stem) => {
      expect(HEAVENLY_STEMS_ELEMENT[stem]).toBeDefined();
    });
  });

  test('모든 매핑값이 유효한 KElement', () => {
    STEMS.forEach((stem) => {
      expect(K_ELEMENTS).toContain(HEAVENLY_STEMS_ELEMENT[stem]);
    });
  });

  test('천간 오행 정확성 — 갑·을 = wood', () => {
    expect(HEAVENLY_STEMS_ELEMENT['甲']).toBe('wood');
    expect(HEAVENLY_STEMS_ELEMENT['乙']).toBe('wood');
  });

  test('천간 오행 정확성 — 병·정 = fire', () => {
    expect(HEAVENLY_STEMS_ELEMENT['丙']).toBe('fire');
    expect(HEAVENLY_STEMS_ELEMENT['丁']).toBe('fire');
  });

  test('천간 오행 정확성 — 무·기 = earth', () => {
    expect(HEAVENLY_STEMS_ELEMENT['戊']).toBe('earth');
    expect(HEAVENLY_STEMS_ELEMENT['己']).toBe('earth');
  });

  test('천간 오행 정확성 — 경·신 = metal', () => {
    expect(HEAVENLY_STEMS_ELEMENT['庚']).toBe('metal');
    expect(HEAVENLY_STEMS_ELEMENT['辛']).toBe('metal');
  });

  test('천간 오행 정확성 — 임·계 = water', () => {
    expect(HEAVENLY_STEMS_ELEMENT['壬']).toBe('water');
    expect(HEAVENLY_STEMS_ELEMENT['癸']).toBe('water');
  });
});

// ── 지지(地支) 매핑 ────────────────────────────────────────────────────────────

describe('EARTHLY_BRANCHES_ELEMENT', () => {
  test('12개 지지 모두 매핑됨', () => {
    expect(Object.keys(EARTHLY_BRANCHES_ELEMENT)).toHaveLength(12);
    BRANCHES.forEach((branch) => {
      expect(EARTHLY_BRANCHES_ELEMENT[branch]).toBeDefined();
    });
  });

  test('모든 main이 유효한 KElement', () => {
    BRANCHES.forEach((branch) => {
      expect(K_ELEMENTS).toContain(EARTHLY_BRANCHES_ELEMENT[branch].main);
    });
  });

  test('모든 weight가 0 초과 1.0 이하', () => {
    BRANCHES.forEach((branch) => {
      const { weight } = EARTHLY_BRANCHES_ELEMENT[branch];
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1.0);
    });
  });

  test('순수 단일 오행 지지 weight = 1.0 (子·卯·酉)', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['子'].weight).toBe(1.0);
    expect(EARTHLY_BRANCHES_ELEMENT['卯'].weight).toBe(1.0);
    expect(EARTHLY_BRANCHES_ELEMENT['酉'].weight).toBe(1.0);
  });

  test('토기 환절 지지 weight = 0.6 (丑·辰·未·戌)', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['丑'].weight).toBe(0.6);
    expect(EARTHLY_BRANCHES_ELEMENT['辰'].weight).toBe(0.6);
    expect(EARTHLY_BRANCHES_ELEMENT['未'].weight).toBe(0.6);
    expect(EARTHLY_BRANCHES_ELEMENT['戌'].weight).toBe(0.6);
  });

  test('지지 오행 정확성 — 자·해 = water', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['子'].main).toBe('water');
    expect(EARTHLY_BRANCHES_ELEMENT['亥'].main).toBe('water');
  });

  test('지지 오행 정확성 — 인·묘 = wood', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['寅'].main).toBe('wood');
    expect(EARTHLY_BRANCHES_ELEMENT['卯'].main).toBe('wood');
  });

  test('지지 오행 정확성 — 사·오 = fire', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['巳'].main).toBe('fire');
    expect(EARTHLY_BRANCHES_ELEMENT['午'].main).toBe('fire');
  });

  test('지지 오행 정확성 — 신·유 = metal', () => {
    expect(EARTHLY_BRANCHES_ELEMENT['申'].main).toBe('metal');
    expect(EARTHLY_BRANCHES_ELEMENT['酉'].main).toBe('metal');
  });

  test('지지 오행 정확성 — 토기 지지 4개 = earth', () => {
    (['丑', '辰', '未', '戌'] as const).forEach((branch) => {
      expect(EARTHLY_BRANCHES_ELEMENT[branch].main).toBe('earth');
    });
  });
});

// ── SASANG_MAPPING ─────────────────────────────────────────────────────────────

describe('SASANG_MAPPING', () => {
  test('5개 KElement 모두 매핑됨', () => {
    expect(Object.keys(SASANG_MAPPING)).toHaveLength(5);
    K_ELEMENTS.forEach((el) => {
      expect(SASANG_MAPPING[el]).toBeDefined();
    });
  });

  test('모든 매핑값이 유효한 SasangType', () => {
    K_ELEMENTS.forEach((el) => {
      expect(SASANG_TYPES).toContain(SASANG_MAPPING[el]);
    });
  });

  test('wood → taeyang, fire → soyang, water → soeum', () => {
    expect(SASANG_MAPPING['wood']).toBe('taeyang');
    expect(SASANG_MAPPING['fire']).toBe('soyang');
    expect(SASANG_MAPPING['water']).toBe('soeum');
  });

  test('earth와 metal 모두 taeeum', () => {
    expect(SASANG_MAPPING['earth']).toBe('taeeum');
    expect(SASANG_MAPPING['metal']).toBe('taeeum');
  });
});

// ── SASANG_NAMES ───────────────────────────────────────────────────────────────

describe('SASANG_NAMES', () => {
  test('4개 SasangType 모두 존재', () => {
    expect(Object.keys(SASANG_NAMES)).toHaveLength(4);
    SASANG_TYPES.forEach((type) => {
      expect(SASANG_NAMES[type]).toBeDefined();
    });
  });

  test('모든 항목이 ko/en 문자열을 가짐', () => {
    SASANG_TYPES.forEach((type) => {
      expect(typeof SASANG_NAMES[type].ko).toBe('string');
      expect(typeof SASANG_NAMES[type].en).toBe('string');
      expect(SASANG_NAMES[type].ko.length).toBeGreaterThan(0);
      expect(SASANG_NAMES[type].en.length).toBeGreaterThan(0);
    });
  });

  test('한글/영문 표기 정확성', () => {
    expect(SASANG_NAMES['taeyang'].ko).toBe('태양인');
    expect(SASANG_NAMES['taeyang'].en).toBe('Taeyang');
    expect(SASANG_NAMES['soeum'].ko).toBe('소음인');
    expect(SASANG_NAMES['soeum'].en).toBe('Soeum');
  });
});
