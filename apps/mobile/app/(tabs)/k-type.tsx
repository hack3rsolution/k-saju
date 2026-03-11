/**
 * k-type.tsx — K-Type 탭 메인 화면
 *
 * 오행(五行) 기반 성격 유형 분석 결과를 표시한다.
 *
 * 3가지 상태:
 *   [로딩]    — ActivityIndicator
 *   [무료]    — KTypeBadge + ElementBarChart + 키워드 + summaryShort + 공유/잠금 해제 버튼
 *   [프리미엄] — 무료 전체 + summaryFull + 강점 + 성장영역 + 직업 + 에너지 + 궁합
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useKPersonality, useShareKPersonality } from '../../src/hooks/useKPersonality';
import { useAuthStore } from '../../src/store/authStore';
import { KTypeBadge } from '../../src/components/kPersonality/KTypeBadge';
import { ElementBarChart } from '../../src/components/kPersonality/ElementBarChart';
import { KPersonalityPaywall } from '../../src/components/kPersonality/KPersonalityPaywall';
import { T } from '../../src/theme/tokens';
import type { KPersonalityFree, KPersonalityPremium } from '../../src/types/kPersonality';

// ── isPremiumResult 타입 가드 ─────────────────────────────────────────────────

function isPremiumResult(d: KPersonalityFree | KPersonalityPremium): d is KPersonalityPremium {
  return 'summaryFull' in d && typeof (d as KPersonalityPremium).summaryFull === 'string';
}

// ── 섹션 헤더 ─────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── 태그 리스트 ───────────────────────────────────────────────────────────────

function TagList({ items, color }: { items: string[]; color?: string }) {
  return (
    <View style={styles.tagRow}>
      {items.map((item, i) => (
        <View key={i} style={[styles.tag, color ? { backgroundColor: color + '22', borderColor: color + '44' } : undefined]}>
          <Text style={[styles.tagText, color ? { color } : undefined]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ── K-Type 탭 화면 ────────────────────────────────────────────────────────────

export default function KTypeScreen() {
  const { t } = useTranslation('common');
  const { data, isLoading, error, refetch } = useKPersonality();
  const { share, isSharing } = useShareKPersonality();
  const { session } = useAuthStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  // ── 로딩 ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.primary.DEFAULT} />
        <Text style={styles.centerText}>{t('kPersonality.analyzing')}</Text>
      </View>
    );
  }

  // ── 에러 ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── 데이터 없음 (사주 미입력) ─────────────────────────────────────────────

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{t('kPersonality.noChart')}</Text>
      </View>
    );
  }

  const premiumData = isPremiumResult(data) ? data : null;

  // ── 결과 화면 ─────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('kPersonality.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('kPersonality.subtitle')}</Text>
        </View>

        {/* 배지 */}
        <KTypeBadge
          sasangType={data.sasangType}
          typeName={data.typeName}
          typeNameKo={data.typeNameKo}
          size="large"
        />

        {/* 오행 차트 */}
        <View style={styles.card}>
          <SectionHeader title={t('kPersonality.yourType')} />
          <ElementBarChart ratio={data.elementRatio} size="medium" animated />
        </View>

        {/* 키워드 */}
        <View style={styles.card}>
          <SectionHeader title={t('kPersonality.keywords')} />
          <TagList items={data.keywords.map(k => `#${k}`)} color={T.primary.light} />
        </View>

        {/* 요약 */}
        <View style={styles.card}>
          <Text style={styles.summary}>{data.summaryShort}</Text>
        </View>

        {/* 프리미엄 전용 섹션 */}
        {premiumData ? (
          <>
            {/* 심층 분석 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.unlockReport')} />
              <Text style={styles.bodyText}>{premiumData.summaryFull}</Text>
            </View>

            {/* 강점 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.strengths')} />
              <TagList items={premiumData.strengths} color={T.element['木']} />
            </View>

            {/* 성장 영역 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.growthAreas')} />
              <TagList items={premiumData.growthAreas} color={T.element['火']} />
            </View>

            {/* 직업 적합도 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.careerFit')} />
              <TagList items={premiumData.careerFit} />
            </View>

            {/* 이달의 에너지 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.monthlyFlow')} />
              <Text style={styles.bodyText}>{premiumData.monthlyEnergyFlow}</Text>
            </View>

            {/* 궁합 유형 */}
            <View style={styles.card}>
              <SectionHeader title={t('kPersonality.compatibility')} />
              <TagList items={premiumData.compatibleTypes} color={T.element['水']} />
            </View>
          </>
        ) : (
          /* 잠금 해제 CTA (무료 유저) */
          <TouchableOpacity style={styles.unlockCard} onPress={() => setPaywallVisible(true)}>
            <Text style={styles.unlockIcon}>🔒</Text>
            <Text style={styles.unlockTitle}>{t('kPersonality.unlockReport')}</Text>
            <Text style={styles.unlockDesc}>{t('kPersonality.unlockDesc')}</Text>
            <View style={styles.unlockBtn}>
              <Text style={styles.unlockBtnText}>{t('upgrade')} →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 공유 버튼 */}
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => share(data)}
          disabled={isSharing}
        >
          <Text style={styles.btnText}>{t('kPersonality.shareCard')}</Text>
        </TouchableOpacity>

        {/* 친구 비교 버튼 */}
        {session && (
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => router.push('/k-type/compare')}
          >
            <Text style={[styles.btnText, { color: T.primary.light }]}>
              {t('kPersonality.compareWithFriend')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Paywall 모달 */}
      <KPersonalityPaywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => { setPaywallVisible(false); refetch(); }}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: T.bg.base },
  content:  { padding: T.spacing[4], gap: T.spacing[4], paddingBottom: T.spacing[10] },

  center: {
    flex:            1,
    backgroundColor: T.bg.base,
    justifyContent:  'center',
    alignItems:      'center',
    gap:             T.spacing[3],
    padding:         T.spacing[6],
  },
  centerText: { color: T.text.muted, fontSize: T.fontSize.base, textAlign: 'center' },
  errorText:  { color: T.semantic.error, fontSize: T.fontSize.base, textAlign: 'center' },
  retryBtn:   { backgroundColor: T.bg.elevated, borderRadius: T.radius.md, paddingHorizontal: T.spacing[5], paddingVertical: T.spacing[3] },
  retryText:  { color: T.text.primary, fontSize: T.fontSize.base, fontWeight: '600' },

  header: { alignItems: 'center', gap: T.spacing[1] },
  headerTitle:    { color: T.text.primary, fontSize: T.fontSize['2xl'], fontWeight: '800' },
  headerSubtitle: { color: T.text.muted,   fontSize: T.fontSize.sm },

  card: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    padding:         T.spacing[4],
    gap:             T.spacing[3],
  },

  sectionHeader: {},
  sectionTitle: {
    color:      T.text.secondary,
    fontSize:   T.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing[2] },
  tag: {
    backgroundColor:   T.primary.muted,
    borderWidth:       1,
    borderColor:       T.border.default,
    borderRadius:      T.radius.full,
    paddingHorizontal: T.spacing[3],
    paddingVertical:   T.spacing[1],
  },
  tagText: { color: T.primary.light, fontSize: T.fontSize.sm, fontWeight: '500' },

  summary:  { color: T.text.secondary, fontSize: T.fontSize.base, lineHeight: 22 },
  bodyText: { color: T.text.secondary, fontSize: T.fontSize.base, lineHeight: 22 },

  unlockCard: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.xl,
    borderWidth:     1,
    borderColor:     T.primary.subtle,
    padding:         T.spacing[6],
    alignItems:      'center',
    gap:             T.spacing[3],
  },
  unlockIcon:    { fontSize: 36 },
  unlockTitle:   { color: T.text.primary, fontSize: T.fontSize.lg, fontWeight: '800' },
  unlockDesc:    { color: T.text.muted, fontSize: T.fontSize.sm, textAlign: 'center' },
  unlockBtn: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius:    T.radius.lg,
    paddingHorizontal: T.spacing[6],
    paddingVertical:   T.spacing[3],
  },
  unlockBtnText: { color: T.text.primary, fontSize: T.fontSize.md, fontWeight: '700' },

  btn: {
    borderRadius:    T.radius.lg,
    paddingVertical: T.spacing[4],
    alignItems:      'center',
  },
  btnSecondary: { backgroundColor: T.bg.elevated, borderWidth: 1, borderColor: T.border.default },
  btnOutline:   { borderWidth: 1, borderColor: T.primary.subtle },
  btnText: { color: T.text.primary, fontSize: T.fontSize.md, fontWeight: '700' },
});
