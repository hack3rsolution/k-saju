/**
 * useContentRecommendation — calls the content-recommendation Edge Function.
 *
 * Reads SSE stream and updates state as each category (music, books, travel)
 * arrives from the server. First category shows immediately (~1-2s),
 * the other two follow within another second via parallel Claude calls.
 *
 * Cache hierarchy:
 *  1. AsyncStorage (30 days) — survives app restarts, checked first
 *  2. Server in-memory (24 h) — emitted instantly as SSE events
 *  3. Claude API — 3 parallel calls, 400 tokens each
 */
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry { data: ContentRecommendation; expiresAt: number }

async function loadRecommendationCache(key: string): Promise<ContentRecommendation | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() > entry.expiresAt) { await AsyncStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

async function saveRecommendationCache(key: string, data: ContentRecommendation): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch { /* ignore */ }
}

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
  /** true while no data has arrived yet (initial blank state) */
  loading: boolean;
  /** true while SSE stream is still open (partial data may be in `data`) */
  streaming: boolean;
  data: ContentRecommendation | null;
  error: string | null;
  fetch: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useContentRecommendation(): ContentRecommendationState {
  const [loading, setLoading]     = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [data, setData]           = useState<ContentRecommendation | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const { session } = useAuthStore();
  const { chart, frame } = useSajuStore();
  const { language } = useLanguageStore();

  const fetch = useCallback(async () => {
    if (!session) { setError('Not signed in'); return; }
    if (!chart)   { setError('Complete onboarding first'); return; }

    // ── 1. AsyncStorage cache check (30 days) ─────────────────────────────────
    const cacheKey = `content-recommendation:${session.user.id}:${chart.dayStem}:${language}`;
    const cached = await loadRecommendationCache(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setStreaming(true);
    setError(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/content-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            dayStem:        chart.dayStem,
            elementBalance: chart.elements,
            frame:          frame ?? 'en',
            userLanguage:   language,
          }),
        },
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }

      // ── 2. Read SSE stream ─────────────────────────────────────────────────
      const reader = resp.body?.getReader();
      if (!reader) {
        throw new Error('Streaming not supported');
      }

      const decoder = new TextDecoder();
      let lineBuffer = '';
      // Local accumulator — source of truth for cache save at end
      const accumulated: { music?: RecommendationItem[]; books?: RecommendationItem[]; travel?: RecommendationItem[] } = {};
      let element = 'Wood';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break outer;

          let event: { type: string; element?: string; items?: RecommendationItem[]; message?: string };
          try {
            event = JSON.parse(payload);
          } catch { continue; }

          if (event.type === 'error') {
            setError(event.message ?? 'Recommendation service unavailable.');
            break outer;
          }

          if (event.element) element = event.element;

          if (event.type === 'music' || event.type === 'books' || event.type === 'travel') {
            const items = event.items ?? [];
            accumulated[event.type] = items;

            // First category to arrive: flip loading→false so UI renders immediately
            setLoading(false);
            setData((prev) => ({
              element,
              music:  prev?.music  ?? [],
              books:  prev?.books  ?? [],
              travel: prev?.travel ?? [],
              [event.type]: items,
            }));
          }
        }
      }

      // ── 3. Save complete result to AsyncStorage ────────────────────────────
      const finalData: ContentRecommendation = {
        element,
        music:  accumulated.music  ?? [],
        books:  accumulated.books  ?? [],
        travel: accumulated.travel ?? [],
      };
      if (finalData.music.length || finalData.books.length || finalData.travel.length) {
        await saveRecommendationCache(cacheKey, finalData);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Recommendation failed');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }, [session, chart, frame, language]);

  return { loading, streaming, data, error, fetch };
}
