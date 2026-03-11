/**
 * lunar.ts — Lunar ↔ Solar date conversion via lunar-javascript.
 *
 * Centralised so birth-input and compatibility screens share
 * the same conversion logic without duplication.
 */

export const LUNAR_LANGUAGES = new Set(['ko', 'zh-Hans', 'zh-Hant', 'ja']);

/**
 * Convert a lunar (農曆) date to the Gregorian (solar) equivalent.
 * Returns null if the date is out of library range or otherwise invalid.
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { Lunar } = require('lunar-javascript');
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  } catch {
    return null;
  }
}

/**
 * Convert a Gregorian (solar) date back to lunar.
 * Returns null if the date is out of library range or otherwise invalid.
 */
export function solarToLunar(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number; isLeap: boolean } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { Solar } = require('lunar-javascript');
    const lunar = Solar.fromYmd(year, month, day).getLunar();
    return {
      year:   lunar.getYear(),
      month:  lunar.getMonth(),
      day:    lunar.getDay(),
      isLeap: lunar.isLeap(),
    };
  } catch {
    return null;
  }
}
