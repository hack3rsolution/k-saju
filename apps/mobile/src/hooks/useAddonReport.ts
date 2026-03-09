/**
 * useAddonReport — calls the addon-report Edge Function.
 *
 * Wraps Claude-powered report generation for all 4 add-on report types.
 * The caller is responsible for entitlement checking before calling generate().
 */
import { useState } from 'react';
import type { SajuChart, DaewoonPeriod } from '@k-saju/saju-engine';
import { getFreshToken } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { friendlyApiError } from '../lib/apiError';

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

// ── Report parser (client-side defensive re-parsing) ─────────────────────────

function extractJsonString(raw: string): string | null {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  const match = clean.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function tryParseReport(jsonStr: string): AddonReport | null {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<AddonReport>;
    if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      return {
        title: String(parsed.title ?? ''),
        overview: String(parsed.overview ?? ''),
        sections: parsed.sections.map((s: ReportSection) => ({
          heading: String(s.heading ?? ''),
          content: String(s.content ?? ''),
        })),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

function parseAddonReport(raw: AddonReport | string): AddonReport {
  // Case 1: edge function returned a raw string (unusual but handle it)
  if (typeof raw === 'string') {
    const jsonStr = extractJsonString(raw);
    if (jsonStr) {
      const parsed = tryParseReport(jsonStr);
      if (parsed) return parsed;
    }
    return { title: '', overview: raw.slice(0, 500), sections: [] };
  }

  // Case 2: already an object — check for fallback formats where JSON ended up in a field

  // Old fallback: single section { heading: 'Analysis', content: <raw Claude response> }
  if (raw.sections?.length === 1 && raw.sections[0].heading === 'Analysis') {
    const jsonStr = extractJsonString(raw.sections[0].content ?? '');
    if (jsonStr) {
      const parsed = tryParseReport(jsonStr);
      if (parsed) return parsed;
    }
    // Re-parse failed — return as-is (showing raw content is better than blank)
    return raw;
  }

  // If sections is empty and overview looks like raw JSON, clear it
  if (!raw.sections?.length && raw.overview?.trimStart().startsWith('{')) {
    return { title: raw.title || '', overview: '', sections: [] };
  }

  return raw;
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
  const { language } = useLanguageStore();

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
        userLanguage: language,
      };

      if (params.partnerChart) {
        body.partnerChart = serializeChart(params.partnerChart, []);
        body.partnerBirthYear = params.partnerBirthYear;
      }

      if (params.name) {
        body.name = params.name;
      }

      const encodedBody = JSON.stringify(body);

      const accessToken = await getFreshToken();
      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/addon-report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: encodedBody,
        },
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json() as { ok: boolean; report: AddonReport | string };
      const rawReport = data.report;
      setReport(parseAddonReport(rawReport));
    } catch (e: unknown) {
      setError(friendlyApiError(e));
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
