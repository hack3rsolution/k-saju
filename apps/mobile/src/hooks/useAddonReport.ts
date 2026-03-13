/**
 * useAddonReport — calls the addon-report Edge Function.
 *
 * Wraps Claude-powered report generation for all 4 add-on report types.
 * The caller is responsible for entitlement checking before calling generate().
 *
 * useCachedAddonReport — variant for career & daewoon reports with:
 *   1순위: Zustand memory cache (instant, survives tab switches)
 *   2순위: AsyncStorage TTL cache (survives app restarts)
 *   3순위: AI generation (only when no valid cache exists)
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SajuChart, BirthData, DaewoonPeriod } from '@k-saju/saju-engine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useReportCacheStore } from '../store/reportCacheStore';
import { useLanguageStore } from '../store/languageStore';
import type { CulturalFrame } from '@k-saju/saju-engine';

// ── Types (mirrors Edge Function types) ──────────────────────────────────────

export type AddonReportType =
  | 'compatibility'
  | 'career'
  | 'daewoon_full'
  | 'name_analysis';

export interface ReportSection {
  heading: string;
  content: string;
}

export interface AddonReport {
  title: string;
  overview: string;
  sections: ReportSection[];
}

export interface GenerateParams {
  reportType: AddonReportType;
  /** Only for compatibility — partner's pre-calculated chart */
  partnerChart?: SajuChart;
  partnerBirthYear?: number;
  /** Only for name_analysis */
  name?: string;
}

export interface AddonReportState {
  loading: boolean;
  report: AddonReport | null;
  error: string | null;
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
}

// ── Chart serialiser ──────────────────────────────────────────────────────────

function serializeChart(chart: SajuChart, daewoon: DaewoonPeriod[]) {
  return {
    yearPillar:      chart.pillars.year,
    monthPillar:     chart.pillars.month,
    dayPillar:       chart.pillars.day,
    hourPillar:      chart.pillars.hour ?? null,
    elementBalance:  chart.elements,
    dayStem:         chart.dayStem,
    daewoonList:     daewoon,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAddonReport(): AddonReportState {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AddonReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuthStore();
  const { chart, daewoon, frame, birthData } = useSajuStore();

  async function generate(params: GenerateParams) {
    if (!session) { setError('Not signed in'); return; }
    if (!chart)   { setError('Chart not available. Complete onboarding first.'); return; }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const body: Record<string, unknown> = {
        reportType: params.reportType,
        chart: serializeChart(chart, daewoon),
        frame: frame ?? 'en',
        birthYear: birthData?.year,
      };

      if (params.partnerChart) {
        body.partnerChart = serializeChart(params.partnerChart, []);
        body.partnerBirthYear = params.partnerBirthYear;
      }

      if (params.name) {
        body.name = params.name;
      }

      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/addon-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json() as { ok: boolean; report: AddonReport };
      setReport(data.report);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Report generation failed');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setReport(null);
    setError(null);
  }

  return { loading, report, error, generate, reset };
}

// ── Cached report hook ────────────────────────────────────────────────────────

const TTL_30_DAYS  = 30  * 24 * 60 * 60 * 1000;
const TTL_365_DAYS = 365 * 24 * 60 * 60 * 1000;

export type CachedReportType = 'career' | 'daewoon_full';

export interface CachedAddonReportState {
  loading: boolean;
  report: AddonReport | null;
  error: string | null;
  /** Call to manually trigger generation (called automatically on mount when unlocked) */
  generate: () => Promise<void>;
}

/**
 * useCachedAddonReport
 *
 * For career ('career') and daewoon ('daewoon_full') reports only.
 * Handles multi-layer caching automatically; callers just render `report`.
 *
 * @param reportType  - 'career' or 'daewoon_full'
 * @param isUnlocked  - entitlement gate; if false, does nothing
 */
export function useCachedAddonReport(
  reportType: CachedReportType,
  isUnlocked: boolean,
): CachedAddonReportState {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { session } = useAuthStore();
  const { chart, daewoon, frame, birthData } = useSajuStore();
  const { language } = useLanguageStore();
  const reportCache  = useReportCacheStore();

  // Determine the memory-cache slot and TTL
  const cacheKey    = reportType === 'career' ? 'careerWealth' : 'daewoon';
  const ttlMs       = reportType === 'career' ? TTL_30_DAYS : TTL_365_DAYS;
  const memoryReport = reportCache[cacheKey];

  // Build stable AsyncStorage key from user's chart signature + language
  function storageKey(): string | null {
    if (!chart) return null;
    const stem   = chart.dayStem ?? 'X';
    const branch = chart.pillars?.day?.branch ?? 'X';
    return `report-${reportType}-${stem}-${branch}-${language}`;
  }

  const generate = useCallback(async () => {
    if (!isUnlocked) return;
    if (!session)    { setError('Not signed in'); return; }
    if (!chart)      { setError('Chart not available. Complete onboarding first.'); return; }

    setLoading(true);
    setError(null);

    try {
      // ── Check AsyncStorage cache ──────────────────────────────────────────
      const sk = storageKey();
      if (sk) {
        const raw = await AsyncStorage.getItem(sk).catch(() => null);
        if (raw) {
          const entry = JSON.parse(raw) as { data: AddonReport; expiresAt: number };
          if (Date.now() < entry.expiresAt) {
            console.log(`[report] AsyncStorage cache hit: ${sk}`);
            if (cacheKey === 'careerWealth') reportCache.setCareerWealth(entry.data);
            else                             reportCache.setDaewoon(entry.data);
            setLoading(false);
            return;
          }
          await AsyncStorage.removeItem(sk).catch(() => null);
        }
      }

      // ── Call API ──────────────────────────────────────────────────────────
      console.log(`[report] Generating via API: ${reportType}`);
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/addon-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            reportType,
            chart: serializeChart(chart, daewoon),
            frame: frame ?? 'en',
            birthYear: birthData?.year,
            userLanguage: language,
          }),
        },
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json() as { ok: boolean; report: AddonReport };
      const report = data.report;

      // ── Save to Zustand (memory) ──────────────────────────────────────────
      if (cacheKey === 'careerWealth') reportCache.setCareerWealth(report);
      else                             reportCache.setDaewoon(report);

      // ── Save to AsyncStorage ──────────────────────────────────────────────
      if (sk) {
        const entry = { data: report, expiresAt: Date.now() + ttlMs };
        await AsyncStorage.setItem(sk, JSON.stringify(entry)).catch(() => null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Report generation failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, session, chart, language, reportType]);

  // Auto-generate on mount if unlocked and no memory cache
  useEffect(() => {
    if (!isUnlocked || memoryReport) return;
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  return { loading, report: memoryReport, error, generate };
}
