// src/constants.ts
var STEMS = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
var BRANCHES = [
  "\u5B50",
  "\u4E11",
  "\u5BC5",
  "\u536F",
  "\u8FB0",
  "\u5DF3",
  "\u5348",
  "\u672A",
  "\u7533",
  "\u9149",
  "\u620C",
  "\u4EA5"
];
var FIVE_ELEMENTS = ["\u6728", "\u706B", "\u571F", "\u91D1", "\u6C34"];
var STEM_ELEMENT = {
  \u7532: "\u6728",
  \u4E59: "\u6728",
  \u4E19: "\u706B",
  \u4E01: "\u706B",
  \u620A: "\u571F",
  \u5DF1: "\u571F",
  \u5E9A: "\u91D1",
  \u8F9B: "\u91D1",
  \u58EC: "\u6C34",
  \u7678: "\u6C34"
};
var BRANCH_ELEMENT = {
  \u5B50: "\u6C34",
  \u4E11: "\u571F",
  \u5BC5: "\u6728",
  \u536F: "\u6728",
  \u8FB0: "\u571F",
  \u5DF3: "\u706B",
  \u5348: "\u706B",
  \u672A: "\u571F",
  \u7533: "\u91D1",
  \u9149: "\u91D1",
  \u620C: "\u571F",
  \u4EA5: "\u6C34"
};
var STEM_POLARITY = {
  \u7532: "yang",
  \u4E59: "yin",
  \u4E19: "yang",
  \u4E01: "yin",
  \u620A: "yang",
  \u5DF1: "yin",
  \u5E9A: "yang",
  \u8F9B: "yin",
  \u58EC: "yang",
  \u7678: "yin"
};
var SEXAGENARY_CYCLE = Array.from(
  { length: 60 },
  (_, i) => `${STEMS[i % 10]}${BRANCHES[i % 12]}`
);
var SEXAGENARY_BASE_YEAR = 1984;

// src/solar-terms.ts
function getSolarTermDate(year, termIndex) {
  const APPROX_DAYS = [
    35,
    // 입춘 Feb 4
    50,
    // 우수 Feb 19
    65,
    // 경칩 Mar 6
    80,
    // 춘분 Mar 21
    95,
    // 청명 Apr 5
    110,
    // 곡우 Apr 20
    126,
    // 입하 May 6
    141,
    // 소만 May 21
    157,
    // 망종 Jun 6
    172,
    // 하지 Jun 22
    188,
    // 소서 Jul 7
    204,
    // 대서 Jul 23
    220,
    // 입추 Aug 8
    235,
    // 처서 Aug 23
    250,
    // 백로 Sep 8
    266,
    // 추분 Sep 23
    281,
    // 한로 Oct 8
    296,
    // 상강 Oct 23
    311,
    // 입동 Nov 7
    326,
    // 소설 Nov 22
    341,
    // 대설 Dec 7
    356,
    // 동지 Dec 22
    5,
    // 소한 Jan 5 (next year for terms 22,23)
    20
    // 대한 Jan 20
  ];
  const doy = APPROX_DAYS[termIndex];
  const targetYear = termIndex >= 22 ? year + 1 : year;
  const d = new Date(Date.UTC(targetYear, 0, 1));
  d.setUTCDate(d.getUTCDate() + doy - 1);
  return d;
}
var TERM_TO_BRANCH = [
  2,
  // 입춘 → 寅
  2,
  // 우수 → 寅 (still)
  3,
  // 경칩 → 卯
  3,
  // 춘분 → 卯
  4,
  // 청명 → 辰
  4,
  // 곡우 → 辰
  5,
  // 입하 → 巳
  5,
  // 소만 → 巳
  6,
  // 망종 → 午
  6,
  // 하지 → 午
  7,
  // 소서 → 未
  7,
  // 대서 → 未
  8,
  // 입추 → 申
  8,
  // 처서 → 申
  9,
  // 백로 → 酉
  9,
  // 추분 → 酉
  10,
  // 한로 → 戌
  10,
  // 상강 → 戌
  11,
  // 입동 → 亥
  11,
  // 소설 → 亥
  0,
  // 대설 → 子
  0,
  // 동지 → 子
  1,
  // 소한 → 丑
  1
  // 대한 → 丑
];
function getMonthBranchBySolarTerm(year, month, day) {
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  let activeTerm = 23;
  for (let t = 0; t < 24; t++) {
    const termDate = getSolarTermDate(year, t);
    if (birthDate >= termDate) {
      activeTerm = t;
    }
  }
  return TERM_TO_BRANCH[activeTerm];
}

// src/pillars.ts
function sexagenaryIndex(offset) {
  const idx = (offset % 60 + 60) % 60;
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };
}
function yearPillar(year) {
  const offset = year - SEXAGENARY_BASE_YEAR;
  return sexagenaryIndex(offset);
}
function monthPillar(year, month, day) {
  const branchIdx = getMonthBranchBySolarTerm(year, month, day);
  const yearStemIdx = STEMS.indexOf(yearPillar(year).stem);
  const branchOffset = (branchIdx - 2 + 12) % 12;
  const stemIdx = (yearStemIdx % 5 * 2 + branchOffset) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
function dayPillar(year, month, day) {
  const REF_DATE = new Date(Date.UTC(2e3, 0, 1));
  const target = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.round((target.getTime() - REF_DATE.getTime()) / 864e5);
  return sexagenaryIndex(diffDays);
}
function hourPillar(hour, dayStem) {
  const branchIdx = Math.floor((hour + 1) % 24 / 2) % 12;
  const dayStemIdx = STEMS.indexOf(dayStem);
  const stemIdx = (dayStemIdx * 2 + branchIdx) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
function calculateFourPillars(birth) {
  const yp = yearPillar(birth.year);
  const mp = monthPillar(birth.year, birth.month, birth.day);
  const dp = dayPillar(birth.year, birth.month, birth.day);
  const hp = birth.hour !== void 0 ? hourPillar(birth.hour, dp.stem) : null;
  return { year: yp, month: mp, day: dp, hour: hp };
}

// src/elements.ts
function calculateElementBalance(pillars) {
  const balance = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  const elementMap = {
    \u6728: "Wood",
    \u706B: "Fire",
    \u571F: "Earth",
    \u91D1: "Metal",
    \u6C34: "Water"
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

// src/daewoon.ts
function nextSexagenary(stem, branch, forward) {
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  const step = forward ? 1 : -1;
  return {
    stem: STEMS[((si + step) % 10 + 10) % 10],
    branch: BRANCHES[((bi + step) % 12 + 12) % 12]
  };
}
function calculateDaewoon(birth, count = 8) {
  const pillars = calculateFourPillars(birth);
  const yearStemIdx = STEMS.indexOf(pillars.year.stem);
  const yearPolarity = STEM_POLARITY[pillars.year.stem];
  const forward = yearPolarity === "yang" && birth.gender === "M" || yearPolarity === "yin" && birth.gender === "F";
  const startAge = 8;
  const periods = [];
  let { stem, branch } = pillars.month;
  for (let i = 0; i < count; i++) {
    ({ stem, branch } = nextSexagenary(stem, branch, forward));
    periods.push({
      index: i,
      startAge: startAge + i * 10,
      pillar: { stem, branch },
      element: BRANCH_ELEMENT[branch]
    });
  }
  return periods;
}

// src/shishin.ts
var ELEMENT_ORDER = ["\u6728", "\u706B", "\u571F", "\u91D1", "\u6C34"];
function elementIndex(e) {
  return ELEMENT_ORDER.indexOf(e);
}
function generates(e) {
  return ELEMENT_ORDER[(elementIndex(e) + 1) % 5];
}
function controls(e) {
  return ELEMENT_ORDER[(elementIndex(e) + 2) % 5];
}
function getShiShin(dayStem, otherStem) {
  const selfEl = STEM_ELEMENT[dayStem];
  const otherEl = STEM_ELEMENT[otherStem];
  const selfPol = STEM_POLARITY[dayStem];
  const otherPol = STEM_POLARITY[otherStem];
  const samePolarity = selfPol === otherPol;
  if (selfEl === otherEl) return samePolarity ? "\uBE44\uACAC" : "\uAC81\uC7AC";
  if (generates(selfEl) === otherEl) return samePolarity ? "\uC2DD\uC2E0" : "\uC0C1\uAD00";
  if (controls(selfEl) === otherEl) return samePolarity ? "\uD3B8\uC7AC" : "\uC815\uC7AC";
  if (controls(otherEl) === selfEl) return samePolarity ? "\uD3B8\uAD00" : "\uC815\uAD00";
  if (generates(otherEl) === selfEl) return samePolarity ? "\uD3B8\uC778" : "\uC815\uC778";
  throw new Error(`Cannot determine ShiShin for dayStem=${dayStem} otherStem=${otherStem}`);
}

// src/relations.ts
var STEM_COMBINATIONS = [
  ["\u7532", "\u5DF1"],
  ["\u4E59", "\u5E9A"],
  ["\u4E19", "\u8F9B"],
  ["\u4E01", "\u58EC"],
  ["\u620A", "\u7678"]
];
function stemHarmony(a, b) {
  return STEM_COMBINATIONS.some(
    ([x, y]) => x === a && y === b || x === b && y === a
  );
}
var BRANCH_6_HARMONY = [
  ["\u5B50", "\u4E11"],
  ["\u5BC5", "\u4EA5"],
  ["\u536F", "\u620C"],
  ["\u8FB0", "\u9149"],
  ["\u5DF3", "\u7533"],
  ["\u5348", "\u672A"]
];
function branch6Harmony(a, b) {
  return BRANCH_6_HARMONY.some(
    ([x, y]) => x === a && y === b || x === b && y === a
  );
}
var BRANCH_3_HARMONY = [
  ["\u7533", "\u5B50", "\u8FB0"],
  // Water
  ["\u5BC5", "\u5348", "\u620C"],
  // Fire
  ["\u5DF3", "\u9149", "\u4E11"],
  // Metal
  ["\u4EA5", "\u536F", "\u672A"]
  // Wood
];
function branch3Harmony(branches) {
  return BRANCH_3_HARMONY.some(
    (group) => group.every((b) => branches.includes(b))
  );
}
var CLASHES = [
  ["\u5B50", "\u5348"],
  ["\u4E11", "\u672A"],
  ["\u5BC5", "\u7533"],
  ["\u536F", "\u9149"],
  ["\u8FB0", "\u620C"],
  ["\u5DF3", "\u4EA5"]
];
function branchClash(a, b) {
  return CLASHES.some(
    ([x, y]) => x === a && y === b || x === b && y === a
  );
}
var PENALTY_GROUPS = [
  ["\u5BC5", "\u5DF3", "\u7533"],
  // 무은지형
  ["\u4E11", "\u620C", "\u672A"],
  // 지세지형
  ["\u5B50", "\u536F"]
  // 무례지형
];
var SELF_PENALTY = ["\u8FB0", "\u5348", "\u9149", "\u4EA5"];
function branchPenalty(a, b) {
  if (SELF_PENALTY.includes(a) && a === b) return true;
  return PENALTY_GROUPS.some(
    (g) => g.includes(a) && g.includes(b) && a !== b
  );
}
var DESTRUCTIONS = [
  ["\u5B50", "\u9149"],
  ["\u5348", "\u536F"],
  ["\u5BC5", "\u4EA5"],
  ["\u5DF3", "\u7533"],
  ["\u8FB0", "\u4E11"],
  ["\u620C", "\u672A"]
];
function branchDestruction(a, b) {
  return DESTRUCTIONS.some(
    ([x, y]) => x === a && y === b || x === b && y === a
  );
}
var HARMS = [
  ["\u5B50", "\u672A"],
  ["\u4E11", "\u5348"],
  ["\u5BC5", "\u5DF3"],
  ["\u536F", "\u8FB0"],
  ["\u7533", "\u4EA5"],
  ["\u9149", "\u620C"]
];
function branchHarm(a, b) {
  return HARMS.some(
    ([x, y]) => x === a && y === b || x === b && y === a
  );
}
function branchRelation(a, b) {
  return {
    harmony6: branch6Harmony(a, b),
    clash: branchClash(a, b),
    penalty: branchPenalty(a, b),
    destruction: branchDestruction(a, b),
    harm: branchHarm(a, b)
  };
}
export {
  BRANCHES,
  BRANCH_ELEMENT,
  FIVE_ELEMENTS,
  SEXAGENARY_BASE_YEAR,
  SEXAGENARY_CYCLE,
  STEMS,
  STEM_ELEMENT,
  STEM_POLARITY,
  branch3Harmony,
  branch6Harmony,
  branchClash,
  branchDestruction,
  branchHarm,
  branchPenalty,
  branchRelation,
  calculateDaewoon,
  calculateElementBalance,
  calculateFourPillars,
  dayPillar,
  getMonthBranchBySolarTerm,
  getShiShin,
  getSolarTermDate,
  hourPillar,
  monthPillar,
  sexagenaryIndex,
  stemHarmony,
  yearPillar
};
