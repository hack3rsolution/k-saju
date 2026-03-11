/**
 * useKPersonality — K-Personality (K-타입) 오행 성격 분석 훅
 *
 * 사주 차트(FourPillars)에서 오행 비율을 계산하고
 * k-personality-analysis Edge Function을 호출해 성격 유형을 반환한다.
 *
 * 캐시 전략 (M4):
 *   1. AsyncStorage (클라이언트): 캐시 히트 시 로딩 스피너 없이 즉시 표시 (TTL = 7일)
 *   2. DB 캐시 (Edge Function): k_personality_readings 테이블 7일 TTL upsert
 *      → 두 캐시 TTL 일치: 클라이언트 캐시 만료 시 서버도 항상 fresh 결과 반환
 */

import { useState, useEffect, useRef } from 'react';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFreshToken, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { useEntitlementStore } from '../store/entitlementStore';
import { friendlyApiError } from '../lib/apiError';
import { buildKPersonalityInput } from '../features/k-personality/engine/calculator';
import type { KPersonalityFree, KPersonalityPremium } from '../types/kPersonality';

// ── AsyncStorage 캐시 헬퍼 ───────────────────────────────────────────────────

const CACHE_PREFIX = 'k_personality_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일 (Edge Function TTL과 동일)

interface CacheEntry {
  data:      KPersonalityFree | KPersonalityPremium;
  expiresAt: number; // Date.now() + TTL
}

function buildCacheKey(userId: string, lang: string, premium: boolean): string {
  return `${CACHE_PREFIX}${userId}_${lang}_${premium ? '1' : '0'}`;
}

async function loadCache(key: string): Promise<(KPersonalityFree | KPersonalityPremium) | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function saveCache(key: string, data: KPersonalityFree | KPersonalityPremium): Promise<void> {
  try {
    const entry: CacheEntry = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch { /* ignore storage errors */ }
}

// ── useKPersonality ───────────────────────────────────────────────────────────

export interface KPersonalityState {
  data:      KPersonalityFree | KPersonalityPremium | null;
  isLoading: boolean;
  error:     string | null;
  isPremium: boolean;
  refetch:   () => void;
}

export function useKPersonality(): KPersonalityState {
  const [data, setData]           = useState<KPersonalityFree | KPersonalityPremium | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [tick, setTick]           = useState(0); // increment to trigger manual refetch

  // forceRefresh: refetch() 호출 시 캐시 무시하고 서버 직접 조회
  const forceRefreshRef = useRef(false);

  const { session }       = useAuthStore();
  const { chart }         = useSajuStore();
  const { language }      = useLanguageStore();
  const { isPremium }     = useEntitlementStore();

  useEffect(() => {
    if (!session || !chart) return;

    let cancelled = false;

    async function fetchPersonality() {
      setError(null);

      const cacheKey = buildCacheKey(session!.user.id, language, isPremium);

      // ── 1. 캐시 확인 ─────────────────────────────────────────────────────
      const isForced = forceRefreshRef.current;
      if (!isForced) {
        const cached = await loadCache(cacheKey);
        if (cached) {
          if (!cancelled) setData(cached);
          // 캐시 히트: 로딩 스피너 없이 백그라운드 갱신 계속
        } else {
          // 캐시 미스: 로딩 스피너 표시
          if (!cancelled) setIsLoading(true);
        }
      } else {
        if (!cancelled) setIsLoading(true);
        forceRefreshRef.current = false;
      }

      // ── 2. Edge Function 호출 ─────────────────────────────────────────────
      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

        const { ratio, sasangType, dominantElement, weakestElement } =
          buildKPersonalityInput(chart!.pillars);

        const accessToken = await getFreshToken();

        const resp = await globalThis.fetch(
          `${supabaseUrl}/functions/v1/k-personality-analysis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              elementRatio:    ratio,
              sasangType,
              dominantElement,
              weakestElement,
              language,
              isPremium,
              userId:          session!.user.id,
            }),
          },
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `HTTP ${resp.status}`);
        }

        const raw = await resp.json() as (KPersonalityFree | KPersonalityPremium) & { cached?: boolean };
        const { cached: _cached, ...result } = raw; // eslint-disable-line @typescript-eslint/no-unused-vars

        if (!cancelled) setData(result as KPersonalityFree | KPersonalityPremium);

        // ── 3. AsyncStorage에 저장 ─────────────────────────────────────────
        await saveCache(cacheKey, result as KPersonalityFree | KPersonalityPremium);

      } catch (e: unknown) {
        // 캐시된 데이터가 있으면 에러 표시 안 함 (백그라운드 갱신 실패)
        if (!cancelled) {
          const hasData = data !== null;
          if (!hasData) setError(friendlyApiError(e));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPersonality();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, chart, language, isPremium, tick]);

  return {
    data,
    isLoading,
    error,
    isPremium,
    refetch: () => {
      forceRefreshRef.current = true;
      setTick(t => t + 1);
    },
  };
}

// ── useShareKPersonality ──────────────────────────────────────────────────────

export interface ShareKPersonalityState {
  share:     (result: KPersonalityFree) => Promise<void>;
  copyLink:  () => Promise<void>;
  isSharing: boolean;
}

/**
 * K-Personality 결과 공유 훅.
 *
 * share()   — share_enabled=true DB 업데이트 후, 성격 유형 요약 + 딥링크를 네이티브 공유 시트로 전송
 * copyLink() — 딥링크만 네이티브 공유 시트로 전송
 *              딥링크: ksaju://k-type?share={userId}&lang={language}
 */
export function useShareKPersonality(): ShareKPersonalityState {
  const [isSharing, setIsSharing] = useState(false);
  const { language }              = useLanguageStore();
  const { session }               = useAuthStore();

  // 공유 전 share_enabled = true 로 DB 업데이트
  async function enableSharing(): Promise<void> {
    if (!session?.user?.id) return;
    await supabase
      .from('k_personality_readings')
      .update({ share_enabled: true })
      .eq('user_id', session.user.id)
      .eq('is_premium', false);
    // 프리미엄 결과도 공유 가능하도록 업데이트
    await supabase
      .from('k_personality_readings')
      .update({ share_enabled: true })
      .eq('user_id', session.user.id)
      .eq('is_premium', true);
  }

  async function share(result: KPersonalityFree): Promise<void> {
    setIsSharing(true);
    try {
      await enableSharing();

      const userId  = session?.user?.id ?? '';
      const tags    = result.keywords.map(k => `#${k}`).join(' ');
      const deeplink = `ksaju://k-type?share=${userId}&lang=${language}`;
      const message =
        `✨ My K-Type: ${result.typeName} (${result.typeNameKo})\n` +
        `${tags}\n\n` +
        `${result.summaryShort}\n\n` +
        deeplink;

      await Share.share({ message });
    } finally {
      setIsSharing(false);
    }
  }

  async function copyLink(): Promise<void> {
    setIsSharing(true);
    try {
      await enableSharing();

      const userId = session?.user?.id ?? '';
      const link   = `ksaju://k-type?share=${userId}&lang=${language}`;
      await Share.share({ message: link, title: 'Share K-Saju K-Type' });
    } finally {
      setIsSharing(false);
    }
  }

  return { share, copyLink, isSharing };
}
