/**
 * 합충형파해 (合沖刑破害) — Stem/Branch Interaction Analysis
 *
 * 천간합 (Heavenly Stem Combinations — 6 합):
 *   甲己合(土), 乙庚合(金), 丙辛合(水), 丁壬合(木), 戊癸合(火)
 *
 * 지지합 (Earthly Branch Combinations):
 *   - 6합(六合): 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未
 *   - 3합(三合): 申子辰(水局), 寅午戌(火局), 巳酉丑(金局), 亥卯未(木局)
 *
 * 충 (Clash — 6충):
 *   子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥
 *
 * 형 (Penalty — 형):
 *   寅巳申(무은지형), 丑戌未(지세지형), 子卯(무례지형)
 *   辰辰, 午午, 酉酉, 亥亥 (자형)
 *
 * 파 (Destruction — 6파):
 *   子酉, 午卯, 寅亥, 巳申, 辰丑, 戌未
 *
 * 해 (Harm — 6해):
 *   子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌
 */

import type { Stem, Branch } from './constants';

// ─── Heavenly Stem 합 ───────────────────────────────────

const STEM_COMBINATIONS: [Stem, Stem][] = [
  ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
];

export function stemHarmony(a: Stem, b: Stem): boolean {
  return STEM_COMBINATIONS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

// ─── Branch 6합 ────────────────────────────────────────

const BRANCH_6_HARMONY: [Branch, Branch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

export function branch6Harmony(a: Branch, b: Branch): boolean {
  return BRANCH_6_HARMONY.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

// ─── Branch 3합 ────────────────────────────────────────

const BRANCH_3_HARMONY: Branch[][] = [
  ['申', '子', '辰'], // Water
  ['寅', '午', '戌'], // Fire
  ['巳', '酉', '丑'], // Metal
  ['亥', '卯', '未'], // Wood
];

export function branch3Harmony(branches: Branch[]): boolean {
  return BRANCH_3_HARMONY.some(
    (group) => group.every((b) => branches.includes(b)),
  );
}

// ─── 충 (Clash) ─────────────────────────────────────────

const CLASHES: [Branch, Branch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

export function branchClash(a: Branch, b: Branch): boolean {
  return CLASHES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

// ─── 형 (Penalty) ───────────────────────────────────────

const PENALTY_GROUPS: Branch[][] = [
  ['寅', '巳', '申'], // 무은지형
  ['丑', '戌', '未'], // 지세지형
  ['子', '卯'],       // 무례지형
];
const SELF_PENALTY: Branch[] = ['辰', '午', '酉', '亥']; // 자형

export function branchPenalty(a: Branch, b: Branch): boolean {
  if (SELF_PENALTY.includes(a) && a === b) return true;
  return PENALTY_GROUPS.some(
    (g) => g.includes(a) && g.includes(b) && a !== b,
  );
}

// ─── 파 (Destruction) ───────────────────────────────────

const DESTRUCTIONS: [Branch, Branch][] = [
  ['子', '酉'], ['午', '卯'], ['寅', '亥'], ['巳', '申'], ['辰', '丑'], ['戌', '未'],
];

export function branchDestruction(a: Branch, b: Branch): boolean {
  return DESTRUCTIONS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

// ─── 해 (Harm) ──────────────────────────────────────────

const HARMS: [Branch, Branch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

export function branchHarm(a: Branch, b: Branch): boolean {
  return HARMS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

/** Convenience: all interactions between two branches */
export interface BranchRelation {
  harmony6: boolean;
  clash: boolean;
  penalty: boolean;
  destruction: boolean;
  harm: boolean;
}

export function branchRelation(a: Branch, b: Branch): BranchRelation {
  return {
    harmony6:    branch6Harmony(a, b),
    clash:       branchClash(a, b),
    penalty:     branchPenalty(a, b),
    destruction: branchDestruction(a, b),
    harm:        branchHarm(a, b),
  };
}
