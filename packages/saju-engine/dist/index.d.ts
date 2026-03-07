/**
 * 10 Heavenly Stems (천간, 天干)
 */
declare const STEMS: readonly ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
type Stem = (typeof STEMS)[number];
/**
 * 12 Earthly Branches (지지, 地支)
 */
declare const BRANCHES: readonly ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
type Branch = (typeof BRANCHES)[number];
/**
 * Five Elements (오행, 五行)
 */
declare const FIVE_ELEMENTS: readonly ["木", "火", "土", "金", "水"];
type FiveElement = (typeof FIVE_ELEMENTS)[number];
/**
 * Stem → Five Element mapping
 */
declare const STEM_ELEMENT: Record<Stem, FiveElement>;
/**
 * Branch → Five Element mapping
 */
declare const BRANCH_ELEMENT: Record<Branch, FiveElement>;
/**
 * Stem → Yin/Yang (음양)
 * Even index (0-based) = Yang (양), Odd = Yin (음)
 */
declare const STEM_POLARITY: Record<Stem, 'yang' | 'yin'>;
/**
 * 60 Sexagenary Cycle (육십갑자)
 * Index 0 = 甲子, 1 = 乙丑, …, 59 = 癸亥
 */
declare const SEXAGENARY_CYCLE: readonly string[];
/**
 * Reference year for sexagenary base: 1984 = 甲子 (index 0)
 */
declare const SEXAGENARY_BASE_YEAR = 1984;

interface Pillar {
    stem: Stem;
    branch: Branch;
}
interface FourPillars {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
}
interface ElementBalance {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
}
interface SajuChart {
    pillars: FourPillars;
    elements: ElementBalance;
    dayStem: Stem;
    dayElement: FiveElement;
}
interface BirthData {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    gender: 'M' | 'F';
}
interface DaewoonPeriod {
    index: number;
    startAge: number;
    pillar: Pillar;
    element: FiveElement;
}
type CulturalFrame = 'kr' | 'cn' | 'jp' | 'en' | 'es' | 'in';

/**
 * Four Pillars (사주팔자) calculation.
 * Month pillar uses solar-term (절기) boundaries for accuracy.
 */

declare function sexagenaryIndex(offset: number): {
    stem: Stem;
    branch: Branch;
};
/** Year pillar (연주) */
declare function yearPillar(year: number): Pillar;
/**
 * Month pillar (월주) — uses solar-term boundary for month branch,
 * then derives month stem from year-stem cycle.
 */
declare function monthPillar(year: number, month: number, day: number): Pillar;
/** Day pillar (일주) — uses a known reference day (2000-01-01 = 甲子, index 0) */
declare function dayPillar(year: number, month: number, day: number): Pillar;
/** Hour pillar (시주) — 2-hour intervals; requires day stem */
declare function hourPillar(hour: number, dayStem: Stem): Pillar;
declare function calculateFourPillars(birth: BirthData): FourPillars;

declare function calculateElementBalance(pillars: FourPillars): ElementBalance;

/**
 * 대운 (大運) — 10-year Major Luck Cycle calculation.
 *
 * Direction:
 *  - Yang year + Male or Yin year + Female → forward (순행)
 *  - Yang year + Female or Yin year + Male → backward (역행)
 *
 * Start age is determined by counting days to the nearest solar term
 * boundary divided by 3 (≈ 1 day = 4 months). This file uses a simplified
 * approximation; replace with a full solar-term table for production.
 */

declare function calculateDaewoon(birth: BirthData, count?: number): DaewoonPeriod[];

/**
 * 십신 (十神) — Ten Gods / Ten Deities
 *
 * Determines the relationship between the 일간 (Day Stem = self)
 * and any other stem/branch based on element generation/control cycles.
 *
 * Classification:
 * - 비겁 (Peers & Competitors): same element
 *   - 비견 (比肩, bǐjiān): same polarity
 *   - 겁재 (劫財, jiécái): opposite polarity
 * - 식상 (Output): self generates other
 *   - 식신 (食神, shíshén): same polarity as self
 *   - 상관 (傷官, shāngguān): opposite polarity
 * - 재성 (Wealth): self controls other
 *   - 편재 (偏財, piāncái): same polarity as self
 *   - 정재 (正財, zhèngcái): opposite polarity
 * - 관성 (Officer): other controls self
 *   - 편관 (偏官, piānguān): same polarity as self
 *   - 정관 (正官, zhèngguān): opposite polarity
 * - 인성 (Resource): other generates self
 *   - 편인 (偏印, piānyìn): same polarity as self
 *   - 정인 (正印, zhèngyìn): opposite polarity
 */

type ShiShin = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
/**
 * Calculates the 십신 relationship from the perspective of `dayStem`.
 * @param dayStem  — 일간 (self)
 * @param otherStem — the stem to classify
 */
declare function getShiShin(dayStem: Stem, otherStem: Stem): ShiShin;

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

declare function stemHarmony(a: Stem, b: Stem): boolean;
declare function branch6Harmony(a: Branch, b: Branch): boolean;
declare function branch3Harmony(branches: Branch[]): boolean;
declare function branchClash(a: Branch, b: Branch): boolean;
declare function branchPenalty(a: Branch, b: Branch): boolean;
declare function branchDestruction(a: Branch, b: Branch): boolean;
declare function branchHarm(a: Branch, b: Branch): boolean;
/** Convenience: all interactions between two branches */
interface BranchRelation {
    harmony6: boolean;
    clash: boolean;
    penalty: boolean;
    destruction: boolean;
    harm: boolean;
}
declare function branchRelation(a: Branch, b: Branch): BranchRelation;

/**
 * 24 Solar Terms (절기) — approximate Gregorian dates.
 *
 * In production, replace with an astronomical ephemeris library
 * (e.g. meeus/astronomia) for exact dates down to the hour.
 *
 * Index mapping (0-based, starting from Lichun 입춘):
 * 0  입춘 Lìchūn    Feb  3–5
 * 1  우수 Yǔshuǐ    Feb 18–20
 * 2  경칩 Jīngzhé   Mar  5–7
 * 3  춘분 Chūnfēn   Mar 20–22
 * 4  청명 Qīngmíng  Apr  4–6
 * 5  곡우 Gǔyǔ      Apr 19–21
 * 6  입하 Lìxià     May  5–7
 * 7  소만 Xiǎomǎn   May 20–22
 * 8  망종 Mángzhòng Jun  5–7
 * 9  하지 Xiàzhì    Jun 21–22
 * 10 소서 Xiǎoshǔ   Jul  6–8
 * 11 대서 Dàshǔ     Jul 22–24
 * 12 입추 Lìqiū     Aug  7–9
 * 13 처서 Chǔshǔ    Aug 22–24
 * 14 백로 Báilù     Sep  7–9
 * 15 추분 Qiūfēn    Sep 22–24
 * 16 한로 Hánlù     Oct  7–9
 * 17 상강 Shuāngjiàng Oct 22–24
 * 18 입동 Lìdōng    Nov  7–8
 * 19 소설 Xiǎoxuě   Nov 21–23
 * 20 대설 Dàxuě     Dec  6–8
 * 21 동지 Dōngzhì   Dec 21–23
 * 22 소한 Xiǎohán   Jan  5–7
 * 23 대한 Dàhán     Jan 19–21
 *
 * Month pillars are determined by which 절기 the birth date falls AFTER:
 * 입춘(Feb)=寅月, 경칩(Mar)=卯月, 청명(Apr)=辰月, ...
 */
/** Returns the approximate solar-term boundary date for a given year and term index (0=입춘). */
declare function getSolarTermDate(year: number, termIndex: number): Date;
declare function getMonthBranchBySolarTerm(year: number, month: number, day: number): number;

export { BRANCHES, BRANCH_ELEMENT, type BirthData, type Branch, type BranchRelation, type CulturalFrame, type DaewoonPeriod, type ElementBalance, FIVE_ELEMENTS, type FiveElement, type FourPillars, type Pillar, SEXAGENARY_BASE_YEAR, SEXAGENARY_CYCLE, STEMS, STEM_ELEMENT, STEM_POLARITY, type SajuChart, type ShiShin, type Stem, branch3Harmony, branch6Harmony, branchClash, branchDestruction, branchHarm, branchPenalty, branchRelation, calculateDaewoon, calculateElementBalance, calculateFourPillars, dayPillar, getMonthBranchBySolarTerm, getShiShin, getSolarTermDate, hourPillar, monthPillar, sexagenaryIndex, stemHarmony, yearPillar };
