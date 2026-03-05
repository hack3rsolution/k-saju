/**
 * useRelationships — CRUD for the relationships table + fortune fetch.
 *
 * - list():   load all relationships from Supabase for the current user
 * - add():    insert a new relationship
 * - remove(): delete a relationship
 * - getFortune(): call the relationship-fortune Edge Function
 */
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useRelationshipStore } from '../store/relationshipStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { friendlyApiError } from '../lib/apiError';
import type {
  Relationship,
  AddRelationshipInput,
  RelationshipFortuneData,
} from '../types/relationship';

// ── DB row → app type ─────────────────────────────────────────────────────────

function rowToRelationship(row: Record<string, unknown>): Relationship {
  return {
    id:                    row.id as string,
    ownerId:               row.owner_id as string,
    name:                  row.name as string,
    birthYear:             row.birth_year as number,
    birthMonth:            row.birth_month as number,
    birthDay:              row.birth_day as number,
    birthHour:             row.birth_hour as number | undefined,
    gender:                row.gender as 'M' | 'F',
    relationshipType:      row.relationship_type as Relationship['relationshipType'],
    compatibilityScore:    row.compatibility_score as number | undefined,
    compatibilityStatus:   row.compatibility_status as Relationship['compatibilityStatus'],
    compatibilityCachedAt: row.compatibility_cached_at as string | undefined,
    createdAt:             row.created_at as string,
    updatedAt:             row.updated_at as string,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRelationships() {
  const { session } = useAuthStore();
  const { chart, frame } = useSajuStore();
  const { language } = useLanguageStore();
  const {
    relationships,
    setRelationships,
    addRelationship,
    removeRelationship,
    updateRelationship,
  } = useRelationshipStore();

  const [loading, setLoading]               = useState(false);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [fortuneError, setFortuneError]     = useState<string | null>(null);

  // ── List ────────────────────────────────────────────────────────────────────

  const list = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) throw new Error(dbErr.message);
      setRelationships((data ?? []).map(rowToRelationship));
    } catch (e) {
      setError(friendlyApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session, setRelationships]);

  // ── Add ─────────────────────────────────────────────────────────────────────

  const add = useCallback(async (input: AddRelationshipInput): Promise<boolean> => {
    if (!session) return false;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('relationships')
        .insert({
          owner_id:          session.user.id,
          name:              input.name,
          birth_year:        input.birthYear,
          birth_month:       input.birthMonth,
          birth_day:         input.birthDay,
          birth_hour:        input.birthHour ?? null,
          gender:            input.gender,
          relationship_type: input.relationshipType,
        })
        .select()
        .single();

      if (dbErr) throw new Error(dbErr.message);
      if (data) addRelationship(rowToRelationship(data as Record<string, unknown>));
      return true;
    } catch (e) {
      setError(friendlyApiError(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, addRelationship]);

  // ── Remove ──────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!session) return false;
    try {
      const { error: dbErr } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id);

      if (dbErr) throw new Error(dbErr.message);
      removeRelationship(id);
      return true;
    } catch (e) {
      setError(friendlyApiError(e));
      return false;
    }
  }, [session, removeRelationship]);

  // ── Get Fortune ─────────────────────────────────────────────────────────────

  const getFortune = useCallback(
    async (rel: Relationship): Promise<RelationshipFortuneData | null> => {
      if (!session || !chart) return null;
      setFortuneLoading(true);
      setFortuneError(null);

      const refMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      // Always fetch a fresh token — handles silent JWT refresh on expiry
      const { data: { session: fresh } } = await supabase.auth.getSession();
      const token = fresh?.access_token;
      if (!token) { setFortuneError('Session expired. Please log in again.'); setFortuneLoading(false); return null; }

      try {
        const resp = await globalThis.fetch(
          `${supabaseUrl}/functions/v1/relationship-fortune`,
          {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              relationshipId:  rel.id,
              ownerChart: {
                yearPillar:     chart.pillars.year,
                monthPillar:    chart.pillars.month,
                dayPillar:      chart.pillars.day,
                hourPillar:     chart.pillars.hour,
                elementBalance: chart.elements,
                dayStem:        chart.dayStem,
              },
              partnerBirth: {
                year:   rel.birthYear,
                month:  rel.birthMonth,
                day:    rel.birthDay,
                hour:   rel.birthHour,
                gender: rel.gender,
              },
              partnerName:      rel.name,
              relationshipType: rel.relationshipType,
              frame:            frame ?? 'en',
              refMonth,
              userLanguage:     language,
            }),
          },
        );

        if (resp.status === 403) {
          setFortuneError('premium_required');
          return null;
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json() as RelationshipFortuneData & { ok: boolean };

        // Update local store with cached score
        updateRelationship(rel.id, {
          compatibilityScore:  data.compatibilityScore,
          compatibilityStatus: data.compatibilityStatus,
        });

        return data;
      } catch (e) {
        setFortuneError(friendlyApiError(e));
        return null;
      } finally {
        setFortuneLoading(false);
      }
    },
    [session, chart, frame, language, updateRelationship],
  );

  return {
    relationships,
    loading,
    fortuneLoading,
    error,
    fortuneError,
    list,
    add,
    remove,
    getFortune,
  };
}
