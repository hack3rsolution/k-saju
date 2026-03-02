import {
  stemHarmony, branch6Harmony, branch3Harmony,
  branchClash, branchPenalty, branchDestruction, branchHarm,
  branchRelation,
} from '../relations';

describe('stemHarmony (천간합)', () => {
  test('甲己合', () => expect(stemHarmony('甲', '己')).toBe(true));
  test('乙庚合', () => expect(stemHarmony('乙', '庚')).toBe(true));
  test('丙辛合', () => expect(stemHarmony('丙', '辛')).toBe(true));
  test('丁壬合', () => expect(stemHarmony('丁', '壬')).toBe(true));
  test('戊癸合', () => expect(stemHarmony('戊', '癸')).toBe(true));
  test('symmetric: 己甲合', () => expect(stemHarmony('己', '甲')).toBe(true));
  test('甲乙 — no combination', () => expect(stemHarmony('甲', '乙')).toBe(false));
});

describe('branch6Harmony (지지 육합)', () => {
  test('子丑合', () => expect(branch6Harmony('子', '丑')).toBe(true));
  test('寅亥合', () => expect(branch6Harmony('寅', '亥')).toBe(true));
  test('卯戌合', () => expect(branch6Harmony('卯', '戌')).toBe(true));
  test('辰酉合', () => expect(branch6Harmony('辰', '酉')).toBe(true));
  test('巳申合', () => expect(branch6Harmony('巳', '申')).toBe(true));
  test('午未合', () => expect(branch6Harmony('午', '未')).toBe(true));
  test('子午 — no 6합', () => expect(branch6Harmony('子', '午')).toBe(false));
});

describe('branch3Harmony (지지 삼합)', () => {
  test('申子辰 = 水局', () => expect(branch3Harmony(['申', '子', '辰'])).toBe(true));
  test('寅午戌 = 火局', () => expect(branch3Harmony(['寅', '午', '戌'])).toBe(true));
  test('巳酉丑 = 金局', () => expect(branch3Harmony(['巳', '酉', '丑'])).toBe(true));
  test('亥卯未 = 木局', () => expect(branch3Harmony(['亥', '卯', '未'])).toBe(true));
  test('申子午 — not a 삼합', () => expect(branch3Harmony(['申', '子', '午'])).toBe(false));
});

describe('branchClash (충)', () => {
  test('子午충', () => expect(branchClash('子', '午')).toBe(true));
  test('丑未충', () => expect(branchClash('丑', '未')).toBe(true));
  test('寅申충', () => expect(branchClash('寅', '申')).toBe(true));
  test('卯酉충', () => expect(branchClash('卯', '酉')).toBe(true));
  test('辰戌충', () => expect(branchClash('辰', '戌')).toBe(true));
  test('巳亥충', () => expect(branchClash('巳', '亥')).toBe(true));
  test('symmetric: 午子충', () => expect(branchClash('午', '子')).toBe(true));
  test('子丑 — no clash', () => expect(branchClash('子', '丑')).toBe(false));
});

describe('branchPenalty (형)', () => {
  test('寅巳형', () => expect(branchPenalty('寅', '巳')).toBe(true));
  test('丑戌형', () => expect(branchPenalty('丑', '戌')).toBe(true));
  test('子卯형 (무례)', () => expect(branchPenalty('子', '卯')).toBe(true));
  test('子丑 — no penalty', () => expect(branchPenalty('子', '丑')).toBe(false));
});

describe('branchDestruction (파)', () => {
  test('子酉파', () => expect(branchDestruction('子', '酉')).toBe(true));
  test('午卯파', () => expect(branchDestruction('午', '卯')).toBe(true));
  test('子午 — no destruction', () => expect(branchDestruction('子', '午')).toBe(false));
});

describe('branchHarm (해)', () => {
  test('子未해', () => expect(branchHarm('子', '未')).toBe(true));
  test('丑午해', () => expect(branchHarm('丑', '午')).toBe(true));
  test('symmetric: 未子해', () => expect(branchHarm('未', '子')).toBe(true));
  test('子丑 — no harm', () => expect(branchHarm('子', '丑')).toBe(false));
});

describe('branchRelation convenience', () => {
  test('子午: clash=true, harmony6=false', () => {
    const r = branchRelation('子', '午');
    expect(r.clash).toBe(true);
    expect(r.harmony6).toBe(false);
  });

  test('子丑: harmony6=true, clash=false', () => {
    const r = branchRelation('子', '丑');
    expect(r.harmony6).toBe(true);
    expect(r.clash).toBe(false);
  });
});
