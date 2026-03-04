/**
 * useContentRecommendation — calls the content-recommendation Edge Function.
 *
 * Returns music / book / travel recommendations based on the user's
 * dominant 오행 (Five Element) and Day Master (일간).
 */
import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { friendlyApiError } from '../lib/apiError';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecommendationItem {
  title: string;
  description: string;
  tag: string;
}

export interface ContentRecommendation {
  element: string;
  music: RecommendationItem[];
  books: RecommendationItem[];
  travel: RecommendationItem[];
}

export interface ContentRecommendationState {
  loading: boolean;
  data: ContentRecommendation | null;
  error: string | null;
  fetch: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useContentRecommendation(): ContentRecommendationState {
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<ContentRecommendation | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const { session } = useAuthStore();
  const { chart, frame } = useSajuStore();

  const fetch = useCallback(async () => {
    if (!session) { setError('Not signed in'); return; }
    if (!chart)   { setError('Complete onboarding first'); return; }

    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const body = {
        dayStem:        chart.dayStem,
        elementBalance: chart.elements,
        frame:          frame ?? 'en',
      };

      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/content-recommendation`,
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

      const json = await resp.json() as { ok: boolean } & ContentRecommendation;
      setData({
        element: json.element,
        music:   json.music,
        books:   json.books,
        travel:  json.travel,
      });
    } catch (e: unknown) {
      setError(friendlyApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session, chart, frame]);

  return { loading, data, error, fetch };
}
