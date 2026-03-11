/**
 * useKPersonality — K-Personality (K-타입) 오행 성격 분석 훅
 *
 * 사주 차트(FourPillars)에서 오행 비율을 계산하고
 * k-personality-analysis Edge Function을 호출해 성격 유형을 반환한다.
 *
 * 캐시 전략: Edge Function 내부에서 7일 TTL로 k_personality_readings 테이블 캐싱.
 *            클라이언트는 캐시 관리 불필요.
 */

import { useState, useEffect } from 'react';
import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { getFreshToken } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';
import { useLanguageStore } from '../store/languageStore';
import { useEntitlementStore } from '../store/entitlementStore';
import { friendlyApiError } from '../lib/apiError';
import { buildKPersonalityInput } from '../features/k-personality/engine/calculator';
import type { KPersonalityFree, KPersonalityPremium } from '../types/kPersonality';

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

  const { session }       = useAuthStore();
  const { chart }         = useSajuStore();
  const { language }      = useLanguageStore();
  const { isPremium }     = useEntitlementStore();

  useEffect(() => {
    if (!session || !chart) return;

    let cancelled = false;

    async function fetchPersonality() {
      setIsLoading(true);
      setError(null);

      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

        // M1-STEP-3: FourPillars → 오행 비율 + 사상체질 계산 (클라이언트 사이드)
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

        // Edge Function 응답에 { cached: boolean } 필드 포함 — 제거 후 저장
        const raw = await resp.json() as (KPersonalityFree | KPersonalityPremium) & { cached?: boolean };
        const { cached: _cached, ...result } = raw; // eslint-disable-line @typescript-eslint/no-unused-vars

        if (!cancelled) setData(result as KPersonalityFree | KPersonalityPremium);
      } catch (e: unknown) {
        if (!cancelled) setError(friendlyApiError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPersonality();

    return () => { cancelled = true; };
  }, [session, chart, language, isPremium, tick]); // tick: manual refetch trigger

  return {
    data,
    isLoading,
    error,
    isPremium,
    refetch: () => setTick(t => t + 1),
  };
}

// ── useShareKPersonality ──────────────────────────────────────────────────────

export interface ShareKPersonalityState {
  share:     (result: KPersonalityFree) => Promise<void>;
  copyLink:  (userId: string) => Promise<void>;
  isSharing: boolean;
}

/**
 * K-Personality 결과 공유 훅.
 *
 * share()    — 성격 유형 요약 + 딥링크를 네이티브 공유 시트로 전송
 * copyLink() — 딥링크 URL만 네이티브 공유 시트로 전송 (expo-clipboard 미설치)
 *              딥링크: ksaju://k-type?share={userId}&lang={language}
 */
export function useShareKPersonality(): ShareKPersonalityState {
  const [isSharing, setIsSharing] = useState(false);
  const { language }              = useLanguageStore();

  async function share(result: KPersonalityFree): Promise<void> {
    setIsSharing(true);
    try {
      const tags    = result.keywords.map(k => `#${k}`).join(' ');
      const deeplink = `ksaju://k-type?lang=${language}`;
      const message =
        `✨ My K-Type: ${result.typeName} (${result.typeNameKo})\n` +
        `${tags}\n\n` +
        `${result.summaryShort}\n\n` +
        deeplink;

      // expo-sharing 사용 가능한 환경이면 그것을 우선 사용, 아니면 React Native Share 사용
      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        // expo-sharing은 파일 공유 전용이므로 텍스트는 Share.share() 사용
        await Share.share({ message });
      } else {
        await Share.share({ message });
      }
    } finally {
      setIsSharing(false);
    }
  }

  async function copyLink(userId: string): Promise<void> {
    setIsSharing(true);
    try {
      const link = `ksaju://k-type?share=${userId}&lang=${language}`;
      await Share.share({ message: link, title: 'Share K-Saju K-Type' });
    } finally {
      setIsSharing(false);
    }
  }

  return { share, copyLink, isSharing };
}
