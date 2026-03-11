/**
 * elementMapping.ts — K-Personality 오행 매핑 상수
 *
 * 천간(天干) · 지지(地支) → KElement 매핑과
 * 지장간(支藏干) 주기(主氣) 가중치를 정의한다.
 *
 * NOTE: KElement는 영문 소문자('wood'|'fire'|...)를 사용한다.
 * saju-engine의 FiveElement(한자 木·火·土·金·水)와 별개 타입이므로 혼용 금지.
 */

import type { Stem, Branch } from '@k-saju/saju-engine';
import type { KElement, SasangType } from '../../../types/kPersonality';

// ── 천간(天干) → KElement ─────────────────────────────────────────────────────
// 갑·을=목, 병·정=화, 무·기=토, 경·신=금, 임·계=수

export const HEAVENLY_STEMS_ELEMENT: Record<Stem, KElement> = {
  甲: 'wood',  乙: 'wood',
  丙: 'fire',  丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

// ── 지지(地支) → KElement (지장간 주기 가중치 포함) ───────────────────────────
//
// weight: 지장간(支藏干) 중 주기(主氣)가 해당 지지 전체 에너지에서 차지하는 비율.
// 순수 단일 오행 지지(子·卯·酉)는 1.0, 토기 환절 지지(丑·辰·未·戌)는 0.6,
// 나머지 화·목·금·수 주기 지지는 0.7~0.8.
//
// 참고: saju-engine의 BRANCH_ELEMENT는 weight 없이 단순 매핑만 제공.
// K-Personality는 더 세밀한 비율 계산을 위해 weight를 별도 관리한다.

export const EARTHLY_BRANCHES_ELEMENT: Record<Branch, {
  main:   KElement;
  weight: number;   // 주기(主氣) 비율 (0 < weight ≤ 1.0)
}> = {
  子: { main: 'water', weight: 1.0 },  // 순수 수(水)
  丑: { main: 'earth', weight: 0.6 },  // 기토(己土) 주기, 신금·계수 포함
  寅: { main: 'wood',  weight: 0.7 },  // 갑목(甲木) 주기, 병화·무토 포함
  卯: { main: 'wood',  weight: 1.0 },  // 순수 목(木)
  辰: { main: 'earth', weight: 0.6 },  // 무토(戊土) 주기, 을목·계수 포함
  巳: { main: 'fire',  weight: 0.7 },  // 병화(丙火) 주기, 경금·무토 포함
  午: { main: 'fire',  weight: 0.8 },  // 정화(丁火) 주기, 기토 포함
  未: { main: 'earth', weight: 0.6 },  // 기토(己土) 주기, 정화·을목 포함
  申: { main: 'metal', weight: 0.7 },  // 경금(庚金) 주기, 임수·무토 포함
  酉: { main: 'metal', weight: 1.0 },  // 순수 금(金)
  戌: { main: 'earth', weight: 0.6 },  // 무토(戊土) 주기, 신금·정화 포함
  亥: { main: 'water', weight: 0.8 },  // 임수(壬水) 주기, 갑목 포함
};

// ── 오행 → 사상체질 매핑 ──────────────────────────────────────────────────────
// 가장 강한 오행(dominantElement)으로 체질을 결정한다.
// 토(earth)와 금(metal)은 모두 태음인 — 중후하고 내실을 중시하는 성질.

export const SASANG_MAPPING: Record<KElement, SasangType> = {
  wood:  'taeyang',  // 태양인: 창의·개척·외향
  fire:  'soyang',   // 소양인: 활동·사교·열정
  earth: 'taeeum',   // 태음인: 안정·실용·중후
  metal: 'taeeum',   // 태음인: 원칙·결단·내실
  water: 'soeum',    // 소음인: 섬세·직관·사색
};

// ── 사상체질 표시명 ───────────────────────────────────────────────────────────

export const SASANG_NAMES: Record<SasangType, { ko: string; en: string }> = {
  taeyang: { ko: '태양인', en: 'Taeyang' },
  soyang:  { ko: '소양인', en: 'Soyang'  },
  taeeum:  { ko: '태음인', en: 'Taeeum'  },
  soeum:   { ko: '소음인', en: 'Soeum'   },
};
