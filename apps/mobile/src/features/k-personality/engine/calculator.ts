/**
 * calculator.ts — K-Personality 오행 비율 계산 함수
 *
 * 사주 8자(FourPillars)에서 오행 비율·사상체질·dominant/weakest 오행을 계산한다.
 *
 * 계산 방식:
 *   - 천간(4개): 각 1.0 고정 가중치
 *   - 지지(4개): EARTHLY_BRANCHES_ELEMENT.weight 적용 (0.6~1.0)
 *   - 시간 미입력(hour=null)이면 3개 기둥(6자)으로 계산
 *   - 전체 합을 100으로 정규화 (소수점 1자리), 반올림 오차는 dominant 오행에서 보정
 */

import type { FourPillars } from '@k-saju/saju-engine';
import type { KElement, FiveElementRatio, SasangType } from '../../../types/kPersonality';
import {
  HEAVENLY_STEMS_ELEMENT,
  EARTHLY_BRANCHES_ELEMENT,
  SASANG_MAPPING,
} from './elementMapping';

const K_ELEMENTS: KElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

// ── 내부 유틸 ─────────────────────────────────────────────────────────────────

function emptyScores(): Record<KElement, number> {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * 사주 8자에서 오행별 비율(합계 100, 소수점 1자리)을 계산한다.
 * hour pillar가 null이면 6자(3기둥)로 계산한다.
 */
export function calculateElementRatio(pillars: FourPillars): FiveElementRatio {
  const scores = emptyScores();

  const activePillars = [
    pillars.year,
    pillars.month,
    pillars.day,
    pillars.hour,
  ].filter((p): p is NonNullable<typeof p> => p !== null);

  for (const pillar of activePillars) {
    // 천간: 고정 가중치 1.0
    scores[HEAVENLY_STEMS_ELEMENT[pillar.stem]] += 1.0;
    // 지지: 지장간 주기 가중치 적용
    const { main, weight } = EARTHLY_BRANCHES_ELEMENT[pillar.branch];
    scores[main] += weight;
  }

  const total = K_ELEMENTS.reduce((s, el) => s + scores[el], 0);

  // 소수점 1자리로 정규화
  const ratio: FiveElementRatio = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const el of K_ELEMENTS) {
    ratio[el] = Math.round((scores[el] / total) * 1000) / 10;
  }

  // 반올림 오차 보정: 합계가 100이 되도록 dominant 오행에서 조정
  const currentSum = K_ELEMENTS.reduce((s, el) => s + ratio[el], 0);
  const diff = Math.round((100 - currentSum) * 10) / 10;
  if (diff !== 0) {
    const dominant = findDominantElement(ratio);
    ratio[dominant] = Math.round((ratio[dominant] + diff) * 10) / 10;
  }

  return ratio;
}

/**
 * 오행 비율에서 가장 강한 오행을 반환한다.
 * 동점이면 K_ELEMENTS 순서(wood→fire→earth→metal→water) 중 먼저 나오는 것 반환.
 */
export function findDominantElement(ratio: FiveElementRatio): KElement {
  return K_ELEMENTS.reduce(
    (best, el) => (ratio[el] > ratio[best] ? el : best),
    K_ELEMENTS[0],
  );
}

/**
 * 오행 비율에서 가장 약한 오행을 반환한다.
 * 동점이면 K_ELEMENTS 순서 중 먼저 나오는 것 반환.
 */
export function findWeakestElement(ratio: FiveElementRatio): KElement {
  return K_ELEMENTS.reduce(
    (weakest, el) => (ratio[el] < ratio[weakest] ? el : weakest),
    K_ELEMENTS[0],
  );
}

/**
 * 오행 비율에서 사상체질을 판별한다.
 *
 * 특례: 토(earth) + 금(metal) 합이 50% 이상이면 태음인(taeeum) 우선 반환.
 *       (단독 dominant가 수·목·화여도 토금 에너지가 절반 이상이면 태음 체질로 판단)
 * 일반: dominant 오행 → SASANG_MAPPING 적용
 */
export function determineSasangType(ratio: FiveElementRatio): SasangType {
  if (ratio.earth + ratio.metal >= 50) return 'taeeum';
  return SASANG_MAPPING[findDominantElement(ratio)];
}

/**
 * FourPillars → K-Personality 계산 통합 함수 (Edge Function / Hook에서 호출).
 */
export function buildKPersonalityInput(pillars: FourPillars): {
  ratio:            FiveElementRatio;
  sasangType:       SasangType;
  dominantElement:  KElement;
  weakestElement:   KElement;
} {
  const ratio           = calculateElementRatio(pillars);
  const dominantElement = findDominantElement(ratio);
  const weakestElement  = findWeakestElement(ratio);
  const sasangType      = determineSasangType(ratio);

  return { ratio, sasangType, dominantElement, weakestElement };
}
