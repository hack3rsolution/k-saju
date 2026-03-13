/**
 * useDailyRoutine — 오행 에너지 기반 데일리 루틴 훅
 *
 * 사용자 사주 데이터(일간/일지/월지/세운)를 daily-routine Edge Function에 전달,
 * 오늘의 지배 오행을 계산하고 음식/색상/활동/명상 텍스트를 반환한다.
 *
 * 캐시 전략:
 *   AsyncStorage — 키: daily_routine_{userId}_{language}_{YYYY-MM-DD}
 *   자정 기준 자동 무효화 (날짜가 달라지면 새로 fetch)
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';

function friendlyApiError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return '요청 처리 중 오류가 발생했습니다.';
}

// ── Types ────────────────────────────────────────────────────────────────────

export type RoutineElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface FoodItem     { name: string; emoji: string; reason: string; color_match: boolean }
export interface ColorItem    { hex: string; name: string; reason: string }
export interface ActivityItem { title: string; duration: string; icon: string; timing: string; reason: string }

export interface DailyRoutineData {
  dominant_element: RoutineElement;
  element_score:    Record<RoutineElement, number>;
  meditation_text:  string;
  foods:            FoodItem[];
  colors:           ColorItem[];
  activities:       ActivityItem[];
  date:             string;
  cached:           boolean;
}

// ── AsyncStorage 캐시 헬퍼 ───────────────────────────────────────────────────

const CACHE_PREFIX = 'daily_routine_';

function todayKST(): string {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function buildCacheKey(userId: string, language: string, date: string): string {
  return `${CACHE_PREFIX}${userId}_${language}_${date}`;
}

async function loadCache(key: string): Promise<DailyRoutineData | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DailyRoutineData;
  } catch {
    return null;
  }
}

async function saveCache(key: string, data: DailyRoutineData): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface DailyRoutineState {
  data:      DailyRoutineData | null;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useDailyRoutine(): DailyRoutineState {
  const [data, setData]           = useState<DailyRoutineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [tick, setTick]           = useState(0);

  const { session }   = useAuthStore();
  const { chart }     = useSajuStore();
  const { language }  = useLanguageStore();

  useEffect(() => {
    // 사주 데이터 없으면 skip (온보딩 미완료)
    if (!session || !chart?.pillars) return;

    let cancelled = false;

    async function fetchRoutine() {
      setError(null);

      const today      = todayKST();
      const userId     = session!.user.id;
      const cacheKey   = buildCacheKey(userId, language, today);

      // 1. 캐시 확인 (오늘 날짜 키로만 유효)
      const cached = await loadCache(cacheKey);
      if (cached) {
        if (!cancelled) setData(cached);
        return;
      }

      if (!cancelled) setIsLoading(true);

      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
        const { data: { session: fresh } } = await supabase.auth.getSession();
        const token       = fresh?.access_token ?? session!.access_token;
        const pillars     = chart!.pillars;

        const resp = await globalThis.fetch(
          `${supabaseUrl}/functions/v1/daily-routine`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({
              saju_data: {
                day_stem:     pillars.day.stem,
                day_branch:   pillars.day.branch,
                month_branch: pillars.month.branch,
                year_stem:    pillars.year.stem,
              },
              language,
            }),
          },
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `HTTP ${resp.status}`);
        }

        const result = await resp.json() as DailyRoutineData;

        if (!cancelled) setData(result);
        await saveCache(cacheKey, result);

      } catch (e: unknown) {
        if (!cancelled && !data) setError(friendlyApiError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRoutine();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, chart, language, tick]);

  return {
    data,
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  };
}
