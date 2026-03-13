import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  type SajuChart,
  type FourPillars,
  type ElementBalance,
  type DaewoonPeriod,
  type FiveElement,
} from '@k-saju/saju-engine';
import { supabase } from '../../src/lib/supabase';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useSajuStore } from '../../src/store/sajuStore';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  registerPushToken,
} from '../../src/lib/notifications';

// ── Element colour palette ──────────────────────────────────────────────────
const ELEMENT_COLOR: Record<FiveElement, string> = {
  木: '#22c55e',
  火: '#ef4444',
  土: '#eab308',
  金: '#94a3b8',
  水: '#3b82f6',
};
const ELEMENT_LABEL: Record<FiveElement, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

// ── Pillar card ──────────────────────────────────────────────────────────────
function PillarCard({
  title,
  pillar,
  blurred = false,
}: {
  title: string;
  pillar: { stem: string; branch: string } | null;
  blurred?: boolean;
}) {
  const { t } = useTranslation('common');
  if (!pillar) {
    return (
      <View style={pStyles.card}>
        <Text style={pStyles.title}>{title}</Text>
        <Text style={pStyles.na}>N/A</Text>
        <Text style={pStyles.naHint}>{t('onboarding.timeUnknown')}</Text>
      </View>
    );
  }
  const stemEl = STEM_ELEMENT[pillar.stem as keyof typeof STEM_ELEMENT];
  const branchEl = BRANCH_ELEMENT[pillar.branch as keyof typeof BRANCH_ELEMENT];
  const stemColor = ELEMENT_COLOR[stemEl];
  const branchColor = ELEMENT_COLOR[branchEl];

  return (
    <View style={[pStyles.card, blurred && pStyles.cardBlurred]}>
      <Text style={pStyles.title}>{title}</Text>
      <Text style={[pStyles.stem, { color: stemColor }]}>{pillar.stem}</Text>
      <Text style={[pStyles.branch, { color: branchColor }]}>{pillar.branch}</Text>
      {blurred ? (
        <Text style={pStyles.lockHint}>🔒</Text>
      ) : (
        <>
          <Text style={[pStyles.elLabel, { color: stemColor }]}>{ELEMENT_LABEL[stemEl]}</Text>
          <Text style={[pStyles.elLabel, { color: branchColor }]}>{ELEMENT_LABEL[branchEl]}</Text>
        </>
      )}
    </View>
  );
}

const pStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#2d1854',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  cardBlurred: { opacity: 0.4 },
  title: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  stem: { fontSize: 26, fontWeight: '700', marginBottom: 2 },
  branch: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  elLabel: { fontSize: 10, fontWeight: '600' },
  na: { fontSize: 22, color: '#5a4d7a', marginTop: 8 },
  naHint: { fontSize: 10, color: '#5a4d7a', marginTop: 4 },
  lockHint: { fontSize: 16, marginTop: 4 },
});

// ── Element balance bar ──────────────────────────────────────────────────────
function ElementBar({ balance }: { balance: ElementBalance }) {
  const total = Object.values(balance).reduce((a, b) => a + b, 0) || 1;
  const elements: FiveElement[] = ['木', '火', '土', '金', '水'];
  return (
    <View style={eStyles.container}>
      {elements.map((el) => {
        const pct = balance[ELEMENT_LABEL[el] as keyof ElementBalance] / total;
        return (
          <View key={el} style={eStyles.row}>
            <Text style={[eStyles.label, { color: ELEMENT_COLOR[el] }]}>{el}</Text>
            <View style={eStyles.track}>
              <View style={[eStyles.fill, { width: `${pct * 100}%`, backgroundColor: ELEMENT_COLOR[el] }]} />
            </View>
            <Text style={eStyles.count}>
              {balance[ELEMENT_LABEL[el] as keyof ElementBalance]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const eStyles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 20, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  track: { flex: 1, height: 10, backgroundColor: '#1a0a2e', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  count: { color: '#9d8fbe', fontSize: 13, width: 16, textAlign: 'right' },
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ResultPreviewScreen() {
  const { t } = useTranslation('common');
  const { birthYear, birthMonth, birthDay, birthHour, gender, frame } = useOnboardingStore();
  const { setChart } = useSajuStore();

  const [saving, setSaving] = useState(false);

  // Compute chart synchronously
  const birthData = {
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour ?? undefined,
    gender: gender ?? 'M',
  };
  const pillars: FourPillars = calculateFourPillars(birthData);
  const elements: ElementBalance = calculateElementBalance(pillars);
  const daywoon: DaewoonPeriod[] = calculateDaewoon(birthData);
  const chart: SajuChart = {
    pillars,
    elements,
    dayStem: pillars.day.stem,
    dayElement: STEM_ELEMENT[pillars.day.stem],
  };

  // Save once on mount
  useEffect(() => {
    saveToSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveToSupabase() {
    setSaving(true);
    try {
      // 1) Mark onboarding complete in user metadata
      await supabase.auth.updateUser({
        data: {
          birth_year: birthYear,
          birth_month: birthMonth,
          birth_day: birthDay,
          birth_hour: birthHour,
          gender,
          cultural_frame: frame,
          onboarding_completed: true,
        },
      });

      // 2) Save chart to saju_charts table (non-blocking on failure)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 2a) Request notification permission + schedule daily + register push token
        requestNotificationPermission().then(async (granted) => {
          if (granted) {
            await scheduleDailyNotification();
            await registerPushToken(user.id);
          }
        }).catch(() => {});

        await supabase.from('saju_charts').upsert({
          user_id: user.id,
          pillars: JSON.stringify(pillars),
          elements: JSON.stringify(elements),
          day_stem: chart.dayStem,
          day_element: chart.dayElement,
          birth_year: birthYear,
          birth_month: birthMonth,
          birth_day: birthDay,
          birth_hour: birthHour,
          gender,
          cultural_frame: frame,
        });
      }
    } catch (e) {
      console.error('[result-preview] Supabase save error:', e);
    } finally {
      setSaving(false);
    }
  }

  function handleExplore() {
    setChart(chart, birthData, daywoon, frame ?? 'en');
    router.replace('/(tabs)/home');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>{t('onboarding.cosmicBlueprint')}</Text>
      <Text style={styles.subtitle}>
        Born {birthYear}/{String(birthMonth).padStart(2,'0')}/{String(birthDay).padStart(2,'0')}
        {birthHour != null ? ` at ${String(birthHour).padStart(2,'0')}:00` : ' (time unknown)'}
      </Text>

      {/* Pillar grid */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>四柱 — Four Pillars</Text>
        <View style={styles.pillarsRow}>
          <PillarCard title="年" pillar={pillars.year} />
          <PillarCard title="月" pillar={pillars.month} />
          <PillarCard title="日" pillar={pillars.day} />
          <PillarCard
            title="時"
            pillar={pillars.hour}
            blurred={pillars.hour !== null}
          />
        </View>
        <Text style={styles.dayStemHint}>
          일간 (self) · {chart.dayStem} · {ELEMENT_LABEL[chart.dayElement]}
        </Text>
      </View>

      {/* Element balance */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>五行 — Element Balance</Text>
        <ElementBar balance={elements} />
      </View>

      {/* Paywall teaser */}
      <View style={styles.teaser}>
        <Text style={styles.teaserTitle}>🔓 Unlock the full reading</Text>
        <Text style={styles.teaserDesc}>
          Daily fortune · Compatibility · Annual luck cycle · 大運 report — all with Premium.
        </Text>
      </View>

      {/* CTAs */}
      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.btnDisabled]}
        onPress={handleExplore}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Explore free features →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push('/paywall')}
      >
        <Text style={styles.secondaryBtnText}>{t('onboarding.viewPremiumPlans')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 28, paddingTop: 72, paddingBottom: 40 },
  step: { color: '#7c3aed', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#b8a9d9', marginBottom: 28 },
  sectionCard: {
    backgroundColor: '#2d1854',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: { color: '#9d8fbe', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 14 },
  pillarsRow: { flexDirection: 'row', marginBottom: 10 },
  dayStemHint: { color: '#7c6d99', fontSize: 12, textAlign: 'center' },
  teaser: { backgroundColor: '#3b1f6e', borderRadius: 16, padding: 18, marginBottom: 20 },
  teaserTitle: { color: '#e9d5ff', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  teaserDesc: { color: '#b8a9d9', fontSize: 13, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
});
