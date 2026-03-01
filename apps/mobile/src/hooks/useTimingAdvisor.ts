/**
 * useTimingAdvisor — calls the timing-advisor Edge Function.
 * Issue #17: Timing Advisor (Decision Engine)
 *
 * Free tier: 1 reading per calendar month (YYYY-MM).
 * Premium / timing_advisor entitlement: unlimited.
 */
import { useState } from 'react';
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  dayPillar,
  monthPillar,
  yearPillar,
  STEM_ELEMENT,
  type BirthData,
} from '@k-saju/saju-engine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useEntitlementStore } from '../store/entitlementStore';
import type { TimingCategory } from '../types/timing';


export interface TimingAdvice {
  score: number;
  headline: string;
  reasons: string[];
  cautions: string[];
}

export interface UseTimingAdvisorResult {
  loading: boolean;
  advice: TimingAdvice | null;
  limitReached: boolean;
  error: string | null;
  analyze: (category: TimingCategory) => Promise<void>;
  reset: () => void;
}

export function useTimingAdvisor(): UseTimingAdvisorResult {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<TimingAdvice | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuthStore();
  const { chart, daewoon, frame, setChart } = useSajuStore();
  const { isPremium, addons } = useEntitlementStore();

  const hasEntitlement = isPremium || addons.timingAdvisor;

  async function analyze(category: TimingCategory) {
    if (!session || loading) return;
    setLoading(true);
    setError(null);
    setAdvice(null);
    setLimitReached(false);

    try {
      // ── Ensure chart is available ─────────────────────────────────────────
      let activeChart = chart;
      let activeDaewoon = daewoon;
      let activeFrame = frame;

      if (!activeChart) {
        const meta = session.user.user_metadata;
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
        const pillars  = calculateFourPillars(birthData);
        const elements = calculateElementBalance(pillars);
        const dw       = calculateDaewoon(birthData);
        activeChart    = { pillars, elements, dayStem: pillars.day.stem, dayElement: STEM_ELEMENT[pillars.day.stem] };
        activeDaewoon  = dw;
        activeFrame    = ((meta.cultural_frame as string) ?? 'en') as typeof frame;
        setChart(activeChart, birthData, dw, activeFrame!);
      }

      // ── Today's sexagenary ────────────────────────────────────────────────
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
      const todaySexagenary = `${dayPillar(y, m, d).stem}${dayPillar(y, m, d).branch}`;
      const refDate = now.toISOString().split('T')[0];

      // ── Call Edge Function ────────────────────────────────────────────────
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/timing-advisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            chart: {
              yearPillar:     activeChart.pillars.year,
              monthPillar:    activeChart.pillars.month,
              dayPillar:      activeChart.pillars.day,
              hourPillar:     activeChart.pillars.hour,
              elementBalance: activeChart.elements,
              dayStem:        activeChart.dayStem,
              daewoonList:    activeDaewoon ?? [],
            },
            frame:           activeFrame ?? 'en',
            category,
            refDate,
            todaySexagenary,
          }),
        },
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json() as {
        ok: boolean;
        limitReached?: boolean;
        advice: TimingAdvice;
      };

      if (data.limitReached) {
        setLimitReached(true);
      } else {
        setAdvice(data.advice);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    advice,
    limitReached,
    error,
    analyze,
    reset: () => { setAdvice(null); setLimitReached(false); setError(null); },
  };
}
