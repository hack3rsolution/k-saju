/**
 * useAddonReport — calls the addon-report Edge Function.
 *
 * Wraps Claude-powered report generation for all 4 add-on report types.
 * The caller is responsible for entitlement checking before calling generate().
 */
import { useState } from 'react';
import type { SajuChart, BirthData, DaewoonPeriod } from '@k-saju/saju-engine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
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
