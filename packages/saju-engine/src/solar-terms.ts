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
export function getSolarTermDate(year: number, termIndex: number): Date {
  // Approximate day-of-year for each term (0-indexed, 0=Jan1)
  const APPROX_DAYS = [
    35,  // 입춘 Feb 4
    50,  // 우수 Feb 19
    65,  // 경칩 Mar 6
    80,  // 춘분 Mar 21
    95,  // 청명 Apr 5
    110, // 곡우 Apr 20
    126, // 입하 May 6
    141, // 소만 May 21
    157, // 망종 Jun 6
    172, // 하지 Jun 22
    188, // 소서 Jul 7
    204, // 대서 Jul 23
    220, // 입추 Aug 8
    235, // 처서 Aug 23
    250, // 백로 Sep 8
    266, // 추분 Sep 23
    281, // 한로 Oct 8
    296, // 상강 Oct 23
    311, // 입동 Nov 7
    326, // 소설 Nov 22
    341, // 대설 Dec 7
    356, // 동지 Dec 22
    5,   // 소한 Jan 5 (next year for terms 22,23)
    20,  // 대한 Jan 20
  ];

  const doy = APPROX_DAYS[termIndex];
  // 소한(22), 대한(23) belong to the *following* calendar year's month cycle
  // but are computed in the *next* year
  const targetYear = termIndex >= 22 ? year + 1 : year;
  const d = new Date(Date.UTC(targetYear, 0, 1));
  d.setUTCDate(d.getUTCDate() + doy - 1);
  return d;
}

/**
 * Returns the month-pillar branch index (0=子…11=亥) for a birth date.
 * Branch follows 절기 boundaries, not calendar months.
 *
 * 입춘 → 寅月(index 2), 경칩 → 卯月(index 3), ..., 대한 → 丑月(index 1)
 */
const TERM_TO_BRANCH: number[] = [
  2,  // 입춘 → 寅
  2,  // 우수 → 寅 (still)
  3,  // 경칩 → 卯
  3,  // 춘분 → 卯
  4,  // 청명 → 辰
  4,  // 곡우 → 辰
  5,  // 입하 → 巳
  5,  // 소만 → 巳
  6,  // 망종 → 午
  6,  // 하지 → 午
  7,  // 소서 → 未
  7,  // 대서 → 未
  8,  // 입추 → 申
  8,  // 처서 → 申
  9,  // 백로 → 酉
  9,  // 추분 → 酉
  10, // 한로 → 戌
  10, // 상강 → 戌
  11, // 입동 → 亥
  11, // 소설 → 亥
  0,  // 대설 → 子
  0,  // 동지 → 子
  1,  // 소한 → 丑
  1,  // 대한 → 丑
];

export function getMonthBranchBySolarTerm(year: number, month: number, day: number): number {
  const birthDate = new Date(Date.UTC(year, month - 1, day));

  // Find the latest solar term boundary that birthDate has passed
  let activeTerm = 23; // default: 대한 (last of previous year's cycle)

  for (let t = 0; t < 24; t++) {
    const termDate = getSolarTermDate(year, t);
    if (birthDate >= termDate) {
      activeTerm = t;
    }
  }

  return TERM_TO_BRANCH[activeTerm];
}
