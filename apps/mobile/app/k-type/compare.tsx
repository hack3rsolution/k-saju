/**
 * compare.tsx — K-Type 친구 비교 화면
 *
 * 딥링크: ksaju://k-type/compare?share={userId}
 * - 공유 유저의 k_personality_readings (share_enabled=true) 를 조회
 * - 현재 유저의 K-Type 결과와 나란히 표시
 * - 오행 상생(相生) 관계 기반 궁합 점수 계산
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useKPersonality } from '../../src/hooks/useKPersonality';
import { KTypeBadge } from '../../src/components/kPersonality/KTypeBadge';
import { ElementBarChart } from '../../src/components/kPersonality/ElementBarChart';
import { T } from '../../src/theme/tokens';
import type { KElement, FiveElementRatio, SasangType } from '../../src/types/kPersonality';

// ── 공유 유저 결과 타입 ───────────────────────────────────────────────────────

interface SharedReading {
  typeName:    string;
  typeNameKo:  string;
  keywords:    string[];
  sasangType:  SasangType;
  elementRatio: FiveElementRatio;
}

// ── 오행 궁합 계산 ────────────────────────────────────────────────────────────

const GENERATING: Partial<Record<KElement, KElement>> = {
  wood:  'fire',
  fire:  'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

const CONTROLLING: Partial<Record<KElement, KElement>> = {
  wood:  'earth',
  earth: 'water',
  water: 'fire',
  fire:  'metal',
  metal: 'wood',
};

function calcCompatScore(myRatio: FiveElementRatio, theirRatio: FiveElementRatio): number {
  const elements: KElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

  let score = 50; // base

  for (const el of elements) {
    const gen = GENERATING[el];
    const ctrl = CONTROLLING[el];
    if (gen)  score += (myRatio[el] / 100) * (theirRatio[gen]  / 100) * 30;
    if (ctrl) score -= (myRatio[el] / 100) * (theirRatio[ctrl] / 100) * 20;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function compatLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: '천생연분 ✨', color: '#22c55e' };
  if (score >= 60) return { text: '좋은 궁합 💫', color: '#a78bfa' };
  if (score >= 40) return { text: '무난한 사이 🌿', color: '#eab308' };
  return { text: '상극 관계 🔥', color: '#ef4444' };
}

// ── compare 화면 ──────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const { share: shareUserId } = useLocalSearchParams<{ share?: string }>();
  const { session }  = useAuthStore();
  const myResult     = useKPersonality();

  const [sharedReading, setSharedReading] = useState<SharedReading | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  // 비로그인 시 로그인 화면으로
  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
    }
  }, [session]);

  // 공유 유저 데이터 조회
  useEffect(() => {
    if (!shareUserId) {
      setError('공유 링크가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data, error: dbErr } = await supabase
          .from('k_personality_readings')
          .select('type_name, type_name_ko, keywords, sasang_type, element_ratio')
          .eq('user_id', shareUserId)
          .eq('share_enabled', true)
          .eq('is_premium', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbErr || !data) {
          setError('해당 유저의 K-Type 정보를 찾을 수 없습니다.');
        } else {
          const row = data as Record<string, unknown>;
          setSharedReading({
            typeName:     String(row.type_name    ?? ''),
            typeNameKo:   String(row.type_name_ko ?? ''),
            keywords:     Array.isArray(row.keywords) ? row.keywords as string[] : [],
            sasangType:   (row.sasang_type as SasangType) ?? 'soyang',
            elementRatio: row.element_ratio as FiveElementRatio,
          });
        }
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shareUserId]);

  // ── 로딩 ───────────────────────────────────────────────────────────────────

  if (loading || myResult.isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'K-Type 비교' }} />
        <ActivityIndicator size="large" color={T.primary.DEFAULT} />
        <Text style={styles.loadingText}>오행 궁합 계산 중…</Text>
      </View>
    );
  }

  if (error || !sharedReading || !myResult.data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'K-Type 비교' }} />
        <Text style={styles.errorText}>{error ?? '내 K-Type 정보를 먼저 확인해주세요.'}</Text>
      </View>
    );
  }

  const compatScore = calcCompatScore(myResult.data.elementRatio, sharedReading.elementRatio);
  const compat      = compatLabel(compatScore);

  // ── 결과 화면 ──────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'K-Type 비교' }} />

      {/* 궁합 점수 */}
      <View style={styles.compatCard}>
        <Text style={styles.compatTitle}>우리의 오행 궁합</Text>
        <Text style={[styles.compatScore, { color: compat.color }]}>{compatScore}</Text>
        <Text style={styles.compatMax}>/ 100</Text>
        <View style={[styles.compatBadge, { backgroundColor: compat.color + '22' }]}>
          <Text style={[styles.compatLabel, { color: compat.color }]}>{compat.text}</Text>
        </View>
      </View>

      {/* 두 유저 나란히 */}
      <View style={styles.compareRow}>
        {/* 나 */}
        <View style={styles.compareCol}>
          <Text style={styles.compareTag}>나</Text>
          <KTypeBadge
            sasangType={myResult.data.sasangType}
            typeName={myResult.data.typeName}
            typeNameKo={myResult.data.typeNameKo}
            size="small"
          />
        </View>

        <Text style={styles.vs}>VS</Text>

        {/* 상대방 */}
        <View style={styles.compareCol}>
          <Text style={styles.compareTag}>친구</Text>
          <KTypeBadge
            sasangType={sharedReading.sasangType}
            typeName={sharedReading.typeName}
            typeNameKo={sharedReading.typeNameKo}
            size="small"
          />
        </View>
      </View>

      {/* 오행 비율 비교 */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>나의 오행</Text>
        <ElementBarChart ratio={myResult.data.elementRatio} size="medium" animated />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>친구의 오행</Text>
        <ElementBarChart ratio={sharedReading.elementRatio} size="medium" animated={false} />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.bg.base },
  content: { padding: T.spacing[4], gap: T.spacing[4] },

  center: {
    flex:           1,
    backgroundColor: T.bg.base,
    justifyContent: 'center',
    alignItems:     'center',
    gap:            T.spacing[3],
  },
  loadingText: { color: T.text.muted, fontSize: T.fontSize.base },
  errorText:   { color: T.text.muted, fontSize: T.fontSize.base, textAlign: 'center', padding: T.spacing[6] },

  compatCard: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.xl,
    padding:         T.spacing[6],
    alignItems:      'center',
    gap:             T.spacing[1],
    ...T.shadow.md,
  },
  compatTitle: { color: T.text.muted, fontSize: T.fontSize.sm, fontWeight: '600', letterSpacing: 1 },
  compatScore: { fontSize: T.fontSize['5xl'], fontWeight: '900', lineHeight: 52 },
  compatMax:   { color: T.text.faint, fontSize: T.fontSize.lg },
  compatBadge: {
    paddingHorizontal: T.spacing[4],
    paddingVertical:   T.spacing[2],
    borderRadius:      T.radius.full,
    marginTop:         T.spacing[2],
  },
  compatLabel: { fontSize: T.fontSize.md, fontWeight: '700' },

  compareRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            T.spacing[3],
  },
  compareCol: {
    flex:       1,
    alignItems: 'center',
    gap:        T.spacing[2],
  },
  compareTag: {
    color:      T.text.muted,
    fontSize:   T.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 2,
  },
  vs: {
    color:      T.text.faint,
    fontSize:   T.fontSize.lg,
    fontWeight: '800',
  },

  chartCard: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    padding:         T.spacing[4],
    gap:             T.spacing[3],
  },
  chartTitle: {
    color:      T.text.muted,
    fontSize:   T.fontSize.sm,
    fontWeight: '600',
  },
});
