/**
 * useJournal — CRUD for the life_events table + AI pattern analysis.
 *
 * - list():        load all events from Supabase for the current user
 * - add():         insert a new life event
 * - remove():      delete an event
 * - getAnalysis(): call the journal-analysis Edge Function (requires >= 5 events)
 */
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useJournalStore } from '../store/journalStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { friendlyApiError } from '../lib/apiError';
import type {
  LifeEvent,
  AddEventInput,
  JournalAnalysisData,
} from '../types/journal';

const RLS_ERROR_MSG = '저장할 수 없습니다. 로그인 상태를 확인해주세요.';

function mapDbError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
    return RLS_ERROR_MSG;
  }
  return friendlyApiError(e);
}

// ── DB row → app type ─────────────────────────────────────────────────────────

function rowToEvent(row: Record<string, unknown>): LifeEvent {
  return {
    id:        row.id as string,
    userId:    row.user_id as string,
    title:     row.title as string,
    category:  row.category as LifeEvent['category'],
    eventDate: row.event_date as string,
    note:      row.note as string | undefined,
    sentiment: row.sentiment as LifeEvent['sentiment'],
    createdAt: row.created_at as string,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJournal() {
  const { session } = useAuthStore();
  const { chart, frame } = useSajuStore();
  const { events, setEvents, addEvent, removeEvent } = useJournalStore();
  const { language } = useLanguageStore();

  const [loading, setLoading]               = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // ── List ────────────────────────────────────────────────────────────────────

  const list = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('life_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (dbErr) throw new Error(dbErr.message);
      setEvents((data ?? []).map(rowToEvent));
    } catch (e) {
      setError(mapDbError(e));
    } finally {
      setLoading(false);
    }
  }, [session, setEvents]);

  // ── Add ─────────────────────────────────────────────────────────────────────

  const add = useCallback(async (input: AddEventInput): Promise<boolean> => {
    if (!session) return false;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('life_events')
        .insert({
          user_id:    session.user.id,
          title:      input.title,
          category:   input.category,
          event_date: input.eventDate,
          note:       input.note ?? null,
          sentiment:  input.sentiment,
        })
        .select()
        .single();

      if (dbErr) throw new Error(dbErr.message);
      if (data) addEvent(rowToEvent(data as Record<string, unknown>));
      return true;
    } catch (e) {
      setError(mapDbError(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, addEvent]);

  // ── Remove ──────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!session) return false;
    try {
      const { error: dbErr } = await supabase
        .from('life_events')
        .delete()
        .eq('id', id);

      if (dbErr) throw new Error(dbErr.message);
      removeEvent(id);
      return true;
    } catch (e) {
      setError(mapDbError(e));
      return false;
    }
  }, [session, removeEvent]);

  // ── Get Analysis ─────────────────────────────────────────────────────────────

  const getAnalysis = useCallback(async (): Promise<JournalAnalysisData | null> => {
    if (!session || !chart) return null;
    if (events.length < 5) return null;

    setAnalysisLoading(true);
    setError(null);

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

    try {
      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/journal-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            events,
            chart: {
              yearPillar:     chart.pillars.year,
              monthPillar:    chart.pillars.month,
              dayPillar:      chart.pillars.day,
              hourPillar:     chart.pillars.hour,
              elementBalance: chart.elements,
              dayStem:        chart.dayStem,
            },
            frame: frame ?? 'en',
            userLanguage: language,
          }),
        },
      );

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json() as JournalAnalysisData;
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analysis');
      return null;
    } finally {
      setAnalysisLoading(false);
    }
  }, [session, chart, frame, events]);

  return {
    events,
    loading,
    analysisLoading,
    error,
    list,
    add,
    remove,
    getAnalysis,
  };
}
