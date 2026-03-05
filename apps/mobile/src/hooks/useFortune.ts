/**
 * useFortune — fetches today's daily reading from the saju-reading Edge Function.
 *
 * Free tier: 1 reading per ISO week, tracked via user_metadata.last_free_reading_week.
 * If the chart isn't in sajuStore (cold start), it's reconstructed from user_metadata.
 */
import { useEffect, useRef, useState } from 'react';
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  dayPillar,
  monthPillar,
  yearPillar,
  STEM_ELEMENT,
  type BirthData,
  type FiveElement,
} from '@k-saju/saju-engine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { useEntitlementStore } from '../store/entitlementStore';
import { friendlyApiError } from '../lib/apiError';

// ── Response types (mirrors supabase/functions/saju-reading/types.ts) ────────

interface LuckyItems {
  color?: string;
  number?: number;
  direction?: string;
  food?: string;
}

interface ReadingData {
  summary: string;
  details: string[];
  luckyItems: LuckyItems | null;
}

// ── ISO week helper ───────────────────────────────────────────────────────────

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Today's sexagenary date ───────────────────────────────────────────────────

function todayGanji() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const yp = yearPillar(y);
  const mp = monthPillar(y, m, d);
  const dp = dayPillar(y, m, d);
  return {
    full: `${yp.stem}${yp.branch}年 ${mp.stem}${mp.branch}月 ${dp.stem}${dp.branch}日`,
    dayStr: dp.stem + dp.branch,
    dayElement: STEM_ELEMENT[dp.stem] as FiveElement,
  };
}

// ── Reading type ──────────────────────────────────────────────────────────────

export type ReadingType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'daewoon';

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface FortuneState {
  loading: boolean;
  reading: ReadingData | null;
  /** Supabase Reading row ID — used for feedback association */
  readingId: string | null;
  error: string | null;
  /** Today's 간지 (연월일) display string */
  ganji: string;
  /** Today's day stem+branch e.g. "丙午" */
  todayDay: string;
  /** Five-element key for today's day stem */
  todayElement: FiveElement;
  /** Free tier: true if the weekly reading has already been used */
  weeklyLimitReached: boolean;
  refresh: () => void;
}

export function useFortune(type: ReadingType = 'daily'): FortuneState {
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weeklyLimitReached, setWeeklyLimitReached] = useState(false);
  const [tick, setTick] = useState(0);
  // Keep last successful reading so it's shown even when the next fetch fails
  const lastReadingRef = useRef<ReadingData | null>(null);

  const { session } = useAuthStore();
  const { chart, daewoon, frame, setChart } = useSajuStore();
  const { language } = useLanguageStore();
  const { isPremium: entitlementPremium } = useEntitlementStore();

  const ganji = todayGanji();
  // Stable ref so the effect below doesn't re-fire when ganji object changes identity
  const ganjiRef = useRef(ganji);
  ganjiRef.current = ganji;

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();

        // ── 1. Ensure chart is available ───────────────────────────────────
        let activeChart = chart;
        let activeDaewoon = daewoon;
        let activeFrame = frame;

        if (!activeChart) {
          const meta = session!.user.user_metadata;
          if (!meta?.birth_year) {
            setError('Chart not found. Please complete onboarding.');
            return;
          }
          const birthData: BirthData = {
            year: meta.birth_year,
            month: meta.birth_month,
            day: meta.birth_day,
            hour: meta.birth_hour ?? undefined,
            gender: (meta.gender as 'M' | 'F') ?? 'M',
          };
          const pillars = calculateFourPillars(birthData);
          const elements = calculateElementBalance(pillars);
          const dw = calculateDaewoon(birthData);
          activeChart = {
            pillars,
            elements,
            dayStem: pillars.day.stem,
            dayElement: STEM_ELEMENT[pillars.day.stem],
          };
          activeDaewoon = dw;
          activeFrame = ((meta.cultural_frame as string) ?? 'en') as typeof frame;
          setChart(activeChart, birthData, dw, activeFrame!);
        }

        // ── 1b. Fallback: reconstruct daewoon if missing from store ────────
        const meta = session!.user.user_metadata;
        if (!activeDaewoon && meta?.birth_year) {
          const bd: BirthData = {
            year: meta.birth_year,
            month: meta.birth_month,
            day: meta.birth_day,
            hour: meta.birth_hour ?? undefined,
            gender: (meta.gender as 'M' | 'F') ?? 'M',
          };
          activeDaewoon = calculateDaewoon(bd);
        }

        // ── 2. Check free weekly limit (daily only) ────────────────────────
        const currentWeek = isoWeek(now);
        const isPremium = meta?.is_premium === true || entitlementPremium;
        const usedThisWeek = type === 'daily' && !isPremium && meta?.last_free_reading_week === currentWeek;

        if (usedThisWeek) {
          setWeeklyLimitReached(true);
          // Don't block on showing previously-loaded reading
          if (!cancelled) setLoading(false);
          return;
        }
        setWeeklyLimitReached(false);

        // ── 3. Call Edge Function ──────────────────────────────────────────
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
        const refDate = now.toISOString().split('T')[0];
        const { dayStr: todayDay } = ganjiRef.current;
        const yp = yearPillar(now.getFullYear());

        // Always fetch a fresh token — handles silent JWT refresh on expiry
        const { data: { session: fresh } } = await supabase.auth.getSession();
        const token = fresh?.access_token;
        if (!token) {
          setError('Session expired. Please log in again.');
          return;
        }

        const resp = await globalThis.fetch(
          `${supabaseUrl}/functions/v1/saju-reading`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              chart: {
                yearPillar: activeChart.pillars.year,
                monthPillar: activeChart.pillars.month,
                dayPillar: activeChart.pillars.day,
                hourPillar: activeChart.pillars.hour,
                elementBalance: activeChart.elements,
                dayStem: activeChart.dayStem,
                daewoonList: activeDaewoon,
              },
              frame: activeFrame ?? 'en',
              type,
              refDate,
              todaySexagenary: todayDay,
              currentYearPillar: yp,
              userLanguage: language,
            }),
          },
        );

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({})) as { message?: string };
          throw new Error(body.message ?? `HTTP ${resp.status}`);
        }

        const data = await resp.json() as { ok: boolean; readingId?: string | null; reading: ReadingData };

        // Safety: Edge Function may store the whole JSON in the summary field on
        // parse-fallback. Unwrap transparently so the UI receives clean fields.
        let parsedReading = data.reading;
        if (typeof parsedReading.summary === 'string' && parsedReading.summary.trim().startsWith('{')) {
          try {
            const inner = JSON.parse(parsedReading.summary) as Partial<ReadingData>;
            if (inner.summary) {
              parsedReading = {
                summary:    inner.summary,
                details:    Array.isArray(inner.details) ? inner.details : parsedReading.details,
                luckyItems: inner.luckyItems !== undefined ? inner.luckyItems : parsedReading.luckyItems,
              };
            }
          } catch { /* keep original */ }
        }

        if (!cancelled) {
          lastReadingRef.current = parsedReading;
          setReading(parsedReading);
          setReadingId(data.readingId ?? null);
        }

        // ── 4. Mark weekly usage for free tier ────────────────────────────
        if (!isPremium) {
          supabase.auth
            .updateUser({ data: { last_free_reading_week: currentWeek } })
            .catch(console.error);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(friendlyApiError(e));
          // Restore last successful reading if available so the UI stays populated
          if (lastReadingRef.current && reading === null) {
            setReading(lastReadingRef.current);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [session, tick, language, type, entitlementPremium]);

  return {
    loading,
    reading,
    readingId,
    error,
    ganji: ganji.full,
    todayDay: ganji.dayStr,
    todayElement: ganji.dayElement,
    weeklyLimitReached,
    refresh: () => setTick((t) => t + 1),
  };
}
