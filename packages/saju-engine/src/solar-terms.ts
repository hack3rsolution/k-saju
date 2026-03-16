/**
 * 24 Solar Terms (절기) — Precise astronomical calculation.
 *
 * Replaces the previous approximate day-of-year table with Jean Meeus's
 * algorithm ("Astronomical Algorithms", Ch. 25), accurate to ±0.01°
 * (≈ ±15 min over 2000–2100). No external dependencies required.
 *
 * Month pillars depend only on the 12 月節 (month-boundary terms):
 *   입춘(315°)→寅, 경칩(345°)→卯, 청명(15°)→辰, 입하(45°)→巳,
 *   망종(75°)→午, 소서(105°)→未, 입추(135°)→申, 백로(165°)→酉,
 *   한로(195°)→戌, 입동(225°)→亥, 대설(255°)→子, 소한(285°)→丑
 *
 * Bug fixed: the old code incorrectly assigned 丑月 to early-January births
 * that fall between 대설 (Dec ~7) and 소한 (Jan ~5). The new algorithm checks
 * both the previous year's and the current year's terms to find the correct
 * most-recent boundary.
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

const D2R = Math.PI / 180;

/** Normalize angle to [0, 360) */
function norm360(a: number): number {
  return ((a % 360) + 360) % 360;
}

/**
 * Julian Day Number for a UTC date/time.
 * Defaults to noon (hour=12) when not provided.
 */
function toJDE(year: number, month: number, day: number, hour = 12): number {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day + hour / 24 + B - 1524.5
  );
}

/** Convert a Julian Day Number to a UTC JS Date (with sub-minute precision). */
function jdeToDate(jde: number): Date {
  const z = Math.floor(jde + 0.5);
  const f = (jde + 0.5) - z;

  let A: number;
  if (z < 2299161) {
    A = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const dayFrac = B - D - Math.floor(30.6001 * E) + f;
  const day      = Math.floor(dayFrac);
  const hourFrac = (dayFrac - day) * 24;
  const month    = E < 14 ? E - 1 : E - 13;
  const year     = month > 2 ? C - 4716 : C - 4715;

  return new Date(
    Date.UTC(year, month - 1, day) + Math.round(hourFrac * 3_600_000),
  );
}

/**
 * Sun's ecliptic longitude (°, 0–360) at a given JDE.
 * Meeus "Astronomical Algorithms" §25 (low-accuracy solar coordinates,
 * error ≈ 0.01° over 2000–2100).
 */
function sunLongitude(jde: number): number {
  const T   = (jde - 2451545.0) / 36525.0;
  const L0  = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M   = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrd = M * D2R;
  const C   =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrd) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrd) +
    0.000289 * Math.sin(3 * Mrd);
  return norm360(L0 + C);
}

/**
 * Find the exact JDE when the Sun reaches `targetLong` (°).
 * Newton's method; converges in < 8 iterations for ≤ 0.01° precision.
 * Starting seed: approximate calendar date `year/month/day`.
 */
function findTermJDE(
  year: number,
  month: number,
  day: number,
  targetLong: number,
): number {
  let jde = toJDE(year, month, day);
  for (let i = 0; i < 50; i++) {
    const L = sunLongitude(jde);
    let diff = targetLong - L;
    if (diff >  180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-8) break;
    jde += diff * (365.25 / 360); // ~1° per day
  }
  return jde;
}

/** Cache JDE values by `"year:targetLong"` to avoid redundant trig work. */
const _termJDECache = new Map<string, number>();

function cachedFindTermJDE(
  year: number,
  month: number,
  day: number,
  targetLong: number,
): number {
  const key = `${year}:${targetLong}`;
  let jde = _termJDECache.get(key);
  if (jde === undefined) {
    jde = findTermJDE(year, month, day, targetLong);
    _termJDECache.set(key, jde);
  }
  return jde;
}

// ── 12 月節 lookup ────────────────────────────────────────────────────────────

/**
 * The 12 month-boundary solar terms (月節), in order.
 * approxMonth/approxDay: Newton's method starting seed for that term.
 * branchIdx: resulting Earthly Branch index (0=子…11=亥).
 *
 * 소한 (index 11, approxMonth=1) always falls in January of the FOLLOWING
 * calendar year relative to the saju year being computed.
 */
const MONTH_JIEQI: ReadonlyArray<{
  targetLong: number;
  approxMonth: number;
  approxDay: number;
  branchIdx: number;
}> = [
  { targetLong: 315, approxMonth: 2,  approxDay: 4, branchIdx: 2  }, // 입춘 → 寅
  { targetLong: 345, approxMonth: 3,  approxDay: 6, branchIdx: 3  }, // 경칩 → 卯
  { targetLong: 15,  approxMonth: 4,  approxDay: 5, branchIdx: 4  }, // 청명 → 辰
  { targetLong: 45,  approxMonth: 5,  approxDay: 6, branchIdx: 5  }, // 입하 → 巳
  { targetLong: 75,  approxMonth: 6,  approxDay: 6, branchIdx: 6  }, // 망종 → 午
  { targetLong: 105, approxMonth: 7,  approxDay: 7, branchIdx: 7  }, // 소서 → 未
  { targetLong: 135, approxMonth: 8,  approxDay: 7, branchIdx: 8  }, // 입추 → 申
  { targetLong: 165, approxMonth: 9,  approxDay: 8, branchIdx: 9  }, // 백로 → 酉
  { targetLong: 195, approxMonth: 10, approxDay: 8, branchIdx: 10 }, // 한로 → 戌
  { targetLong: 225, approxMonth: 11, approxDay: 7, branchIdx: 11 }, // 입동 → 亥
  { targetLong: 255, approxMonth: 12, approxDay: 7, branchIdx: 0  }, // 대설 → 子
  { targetLong: 285, approxMonth: 1,  approxDay: 6, branchIdx: 1  }, // 소한 → 丑 (next year)
];

// ── Approximate dates for the 12 中氣 (backward compatibility) ────────────────

/** Approximate day-of-year for all 24 solar terms (used only for 中氣 in getSolarTermDate). */
const APPROX_DAYS = [
  35,  // 0  입춘 Feb 4
  50,  // 1  우수 Feb 19
  65,  // 2  경칩 Mar 6
  80,  // 3  춘분 Mar 21
  95,  // 4  청명 Apr 5
  110, // 5  곡우 Apr 20
  126, // 6  입하 May 6
  141, // 7  소만 May 21
  157, // 8  망종 Jun 6
  172, // 9  하지 Jun 22
  188, // 10 소서 Jul 7
  204, // 11 대서 Jul 23
  220, // 12 입추 Aug 8
  235, // 13 처서 Aug 23
  250, // 14 백로 Sep 8
  266, // 15 추분 Sep 23
  281, // 16 한로 Oct 8
  296, // 17 상강 Oct 23
  311, // 18 입동 Nov 7
  326, // 19 소설 Nov 22
  341, // 20 대설 Dec 7
  356, // 21 동지 Dec 22
    5, // 22 소한 Jan 5 (next year)
   20, // 23 대한 Jan 20 (next year)
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the solar-term boundary Date for a given year and term index (0 = 입춘).
 *
 * For the 12 月節 (even indices 0, 2, 4, …, 22) the date is computed with
 * full astronomical precision (Meeus Ch. 25, ≈ ±15 min for 2000–2100).
 * For the 12 中氣 (odd indices 1, 3, 5, …, 23) the pre-existing approximate
 * date is returned (sufficient because 中氣 do not affect month pillar).
 *
 * Terms 22 (소한) and 23 (대한) refer to dates in `year + 1`.
 */
export function getSolarTermDate(year: number, termIndex: number): Date {
  if (termIndex % 2 === 0) {
    // 月節: precise astronomical calculation
    const jieqiIdx = termIndex / 2; // 0=입춘 … 11=소한
    const { targetLong, approxMonth, approxDay } = MONTH_JIEQI[jieqiIdx];
    // 소한 (jieqiIdx=11) falls in January of the *following* year
    const termYear = jieqiIdx === 11 ? year + 1 : year;
    const jde = cachedFindTermJDE(termYear, approxMonth, approxDay, targetLong);
    return jdeToDate(jde);
  }

  // 中氣: approximate fallback (not used for month-pillar calculation)
  const doy        = APPROX_DAYS[termIndex];
  const targetYear = termIndex >= 22 ? year + 1 : year;
  const d          = new Date(Date.UTC(targetYear, 0, 1));
  d.setUTCDate(d.getUTCDate() + doy - 1);
  return d;
}

/**
 * Returns the month-pillar branch index (0=子…11=亥) for a birth date.
 *
 * Branch follows 月節 boundaries (the 12 terms that open each lunar month),
 * NOT calendar months. The algorithm compares the birth instant against
 * both the previous year's and the current year's 月節 to correctly handle
 * year-boundary cases (e.g., Dec–Jan births between 대설 and 소한).
 *
 * @param year  Gregorian year of birth
 * @param month 1-based month
 * @param day   Day of month
 * @param hour  UTC birth hour (0–23). Defaults to 0 (midnight UTC).
 *              Supply the actual birth hour for hour-level precision on the
 *              exact day of a solar term.
 *
 * Branch mapping:
 *   입춘→寅(2), 경칩→卯(3), 청명→辰(4), 입하→巳(5), 망종→午(6),
 *   소서→未(7), 입추→申(8), 백로→酉(9), 한로→戌(10), 입동→亥(11),
 *   대설→子(0), 소한→丑(1)
 */
export function getMonthBranchBySolarTerm(
  year: number,
  month: number,
  day: number,
  hour = 0,
): number {
  const birthMs = Date.UTC(year, month - 1, day) + hour * 3_600_000;

  // Track the most-recent 月節 that occurred at or before the birth instant.
  // We check both (year-1) and (year) to cover the Dec–Jan boundary correctly.
  let bestTermMs    = -Infinity;
  let activeBranchIdx = 1; // fallback: 丑月 (before 입춘)

  for (const termYear of [year - 1, year]) {
    for (const { targetLong, approxMonth, approxDay, branchIdx } of MONTH_JIEQI) {
      // 소한 (approxMonth=1) is in January of the year AFTER the saju year
      const actualYear = approxMonth === 1 ? termYear + 1 : termYear;
      const termMs = jdeToDate(
        cachedFindTermJDE(actualYear, approxMonth, approxDay, targetLong),
      ).getTime();

      if (termMs <= birthMs && termMs > bestTermMs) {
        bestTermMs      = termMs;
        activeBranchIdx = branchIdx;
      }
    }
  }

  return activeBranchIdx;
}
