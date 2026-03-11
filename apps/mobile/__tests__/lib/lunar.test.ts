/**
 * lunar.ts — unit tests
 *
 * Covers:
 *   - Round-trip: solar → lunar → solar = original
 *   - Leap month (윤달): 2023 윤2월 (leap 2nd month)
 *   - Boundary values: near library min/max range
 *   - Invalid date returns null
 *   - LUNAR_LANGUAGES set membership
 */

export {};

// ── Mock lunar-javascript ─────────────────────────────────────────────────────

// We mock the library so tests run without the native dep and are deterministic.
// The mock models enough behaviour to verify our wrapper logic.

type LunarDate = { year: number; month: number; day: number; leap: boolean };
type SolarDate = { year: number; month: number; day: number };

// Minimal lookup table for test cases.
// Key: `${lunarYear}-${lunarMonth}-${lunarDay}-${leap}`
// Value: solar date
const LUNAR_TO_SOLAR_TABLE: Record<string, SolarDate> = {
  // Standard date: lunar 2000-01-01 → solar 2000-02-05
  '2000-1-1-false':  { year: 2000, month: 2,  day: 5  },
  // Leap 2nd month 2023: lunar 2023-2-1 (leap) → solar 2023-03-22
  '2023-2-1-true':   { year: 2023, month: 3,  day: 22 },
  // Boundary low: lunar 1900-01-01 → solar 1900-01-31
  '1900-1-1-false':  { year: 1900, month: 1,  day: 31 },
  // Boundary high: lunar 2100-10-01 → solar 2100-11-05 (approximate)
  '2100-10-1-false': { year: 2100, month: 11, day: 5  },
};

// Reverse table for solarToLunar
const SOLAR_TO_LUNAR_TABLE: Record<string, LunarDate> = {
  '2000-2-5':   { year: 2000, month: 1,  day: 1,  leap: false },
  '2023-3-22':  { year: 2023, month: 2,  day: 1,  leap: true  },
  '1900-1-31':  { year: 1900, month: 1,  day: 1,  leap: false },
  '2100-11-5':  { year: 2100, month: 10, day: 1,  leap: false },
};

jest.mock('lunar-javascript', () => {
  class MockLunar {
    private _y: number;
    private _m: number;
    private _d: number;
    private _leap: boolean;

    constructor(y: number, m: number, d: number, leap = false) {
      this._y = y; this._m = m; this._d = d; this._leap = leap;
    }

    static fromYmd(y: number, m: number, d: number) {
      const key = `${y}-${m}-${d}-false`;
      if (!LUNAR_TO_SOLAR_TABLE[key]) throw new Error(`Out of range: ${key}`);
      return new MockLunar(y, m, d, false);
    }

    // For leap-month tests use fromYmdIsLeap
    static fromYmdIsLeap(y: number, m: number, d: number, leap: boolean) {
      const key = `${y}-${m}-${d}-${leap}`;
      if (!LUNAR_TO_SOLAR_TABLE[key]) throw new Error(`Out of range: ${key}`);
      return new MockLunar(y, m, d, leap);
    }

    getSolar() {
      const key = `${this._y}-${this._m}-${this._d}-${this._leap}`;
      const s = LUNAR_TO_SOLAR_TABLE[key];
      if (!s) throw new Error(`No solar mapping for lunar ${key}`);
      return {
        getYear:  () => s.year,
        getMonth: () => s.month,
        getDay:   () => s.day,
      };
    }

    getYear()  { return this._y; }
    getMonth() { return this._m; }
    getDay()   { return this._d; }
    isLeap()   { return this._leap; }
  }

  class MockSolar {
    private _y: number;
    private _m: number;
    private _d: number;

    constructor(y: number, m: number, d: number) {
      this._y = y; this._m = m; this._d = d;
    }

    static fromYmd(y: number, m: number, d: number) {
      const key = `${y}-${m}-${d}`;
      if (!SOLAR_TO_LUNAR_TABLE[key]) throw new Error(`Out of range: ${key}`);
      return new MockSolar(y, m, d);
    }

    getLunar() {
      const key = `${this._y}-${this._m}-${this._d}`;
      const l = SOLAR_TO_LUNAR_TABLE[key];
      if (!l) throw new Error(`No lunar mapping for solar ${key}`);
      return {
        getYear:  () => l.year,
        getMonth: () => l.month,
        getDay:   () => l.day,
        isLeap:   () => l.leap,
      };
    }
  }

  return { Lunar: MockLunar, Solar: MockSolar };
}, { virtual: true });

// ── Import after mock setup ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { lunarToSolar, solarToLunar, LUNAR_LANGUAGES } =
  require('../../src/lib/lunar') as typeof import('../../src/lib/lunar');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('lunarToSolar', () => {
  it('converts a known lunar date to the correct solar date', () => {
    const result = lunarToSolar(2000, 1, 1);
    expect(result).toEqual({ year: 2000, month: 2, day: 5 });
  });

  it('boundary low — 1900-01-01 lunar converts correctly', () => {
    const result = lunarToSolar(1900, 1, 1);
    expect(result).toEqual({ year: 1900, month: 1, day: 31 });
  });

  it('boundary high — 2100-10-01 lunar converts correctly', () => {
    const result = lunarToSolar(2100, 10, 1);
    expect(result).toEqual({ year: 2100, month: 11, day: 5 });
  });

  it('returns null for out-of-range dates instead of throwing', () => {
    // 9999-99-99 is not in the mock table → library throws → we return null
    const result = lunarToSolar(9999, 99, 99);
    expect(result).toBeNull();
  });
});

describe('solarToLunar', () => {
  it('converts a known solar date back to the correct lunar date', () => {
    const result = solarToLunar(2000, 2, 5);
    expect(result).toEqual({ year: 2000, month: 1, day: 1, isLeap: false });
  });

  it('correctly identifies a leap month (윤달 2023년 윤2월)', () => {
    const result = solarToLunar(2023, 3, 22);
    expect(result).not.toBeNull();
    expect(result!.isLeap).toBe(true);
    expect(result!.month).toBe(2);
  });

  it('returns null for out-of-range dates instead of throwing', () => {
    const result = solarToLunar(9999, 99, 99);
    expect(result).toBeNull();
  });
});

describe('round-trip: solar → lunar → solar', () => {
  it('2000-02-05 solar round-trips correctly', () => {
    const lunar = solarToLunar(2000, 2, 5);
    expect(lunar).not.toBeNull();
    const backToSolar = lunarToSolar(lunar!.year, lunar!.month, lunar!.day);
    expect(backToSolar).toEqual({ year: 2000, month: 2, day: 5 });
  });

  it('1900-01-31 solar round-trips correctly', () => {
    const lunar = solarToLunar(1900, 1, 31);
    expect(lunar).not.toBeNull();
    const backToSolar = lunarToSolar(lunar!.year, lunar!.month, lunar!.day);
    expect(backToSolar).toEqual({ year: 1900, month: 1, day: 31 });
  });
});

describe('LUNAR_LANGUAGES', () => {
  it('contains the four East Asian locales', () => {
    expect(LUNAR_LANGUAGES.has('ko')).toBe(true);
    expect(LUNAR_LANGUAGES.has('zh-Hans')).toBe(true);
    expect(LUNAR_LANGUAGES.has('zh-Hant')).toBe(true);
    expect(LUNAR_LANGUAGES.has('ja')).toBe(true);
  });

  it('does not include Latin-script locales', () => {
    expect(LUNAR_LANGUAGES.has('en')).toBe(false);
    expect(LUNAR_LANGUAGES.has('es')).toBe(false);
    expect(LUNAR_LANGUAGES.has('fr')).toBe(false);
    expect(LUNAR_LANGUAGES.has('ar')).toBe(false);
  });
});
