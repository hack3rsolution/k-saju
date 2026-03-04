/**
 * Compatibility screen — 궁합 analysis.
 *
 * Freemium strategy:
 *   FREE   → local element-harmony score (0-100) + one-line summary
 *            "See why — Unlock full report $4.99" CTA
 *   ADDON  → full AI Compatibility Report (deepCompatibility entitlement)
 *
 * Local score algorithm (no network required):
 *   Compares day/month/year element pairs using 오행 상생(+) / 상극(-) rules.
 *   Day pillar weighted 40%, Month 30%, Year 30%.
 *   Final score scaled to 0-100.
 *
 * DEV_BYPASS: EXPO_PUBLIC_ENABLE_DEV_BYPASS=true skips addon gate in dev.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  calculateFourPillars,
  calculateElementBalance,
  STEM_ELEMENT,
  type BirthData,
  type SajuChart,
  type FiveElement,
} from '@k-saju/saju-engine';
import { useAddonReport } from '../../src/hooks/useAddonReport';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import { useSajuStore } from '../../src/store/sajuStore';
import type { ReportSection } from '../../src/hooks/useAddonReport';
import { lunarToSolar } from '../../src/lib/lunar';

const DEV_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';

const LUNAR_FRAMES = new Set(['kr', 'cn', 'jp']);

// ── Local element harmony score ───────────────────────────────────────────────

/** 오행 상생 (generating) table */
const GENERATES: Partial<Record<FiveElement, FiveElement>> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

/** 오행 상극 (controlling) table */
const CONTROLS: Partial<Record<FiveElement, FiveElement>> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

/**
 * Score a single element pair: 100 = generating (harmony), 70 = same, 50 = neutral, 30 = controlling.
 */
function scorePair(a: FiveElement, b: FiveElement): number {
  if (a === b) return 70;
  if (GENERATES[a] === b || GENERATES[b] === a) return 100;
  if (CONTROLS[a] === b || CONTROLS[b] === a) return 30;
  return 50; // neutral
}

interface RawCompatibility {
  score: number;
  summaryKey: 'excellent' | 'strong' | 'moderate' | 'challenging' | 'tension';
  dayRelationType: 'nourishes' | 'nourished_by' | 'challenges' | 'challenged_by' | 'same' | 'independent';
  dayElemA: FiveElement;
  dayElemB: FiveElement;
}

interface LocalCompatibility {
  score: number;
  summary: string;
  dayRelation: string;
}

/**
 * Calculate a 0-100 compatibility score from two saju charts using element harmony rules.
 * Day pillar 40%, Month 30%, Year 30%.
 */
function calculateRawCompatibility(userChart: SajuChart, partnerChart: SajuChart): RawCompatibility {
  const dayScore   = scorePair(STEM_ELEMENT[userChart.pillars.day.stem]!,   STEM_ELEMENT[partnerChart.pillars.day.stem]!);
  const monthScore = scorePair(STEM_ELEMENT[userChart.pillars.month.stem]!, STEM_ELEMENT[partnerChart.pillars.month.stem]!);
  const yearScore  = scorePair(STEM_ELEMENT[userChart.pillars.year.stem]!,  STEM_ELEMENT[partnerChart.pillars.year.stem]!);

  const weighted = dayScore * 0.4 + monthScore * 0.3 + yearScore * 0.3;
  const score = Math.round(weighted);

  const dA = STEM_ELEMENT[userChart.pillars.day.stem]!;
  const dB = STEM_ELEMENT[partnerChart.pillars.day.stem]!;

  let dayRelationType: RawCompatibility['dayRelationType'];
  if (GENERATES[dA] === dB)       dayRelationType = 'nourishes';
  else if (GENERATES[dB] === dA)  dayRelationType = 'nourished_by';
  else if (CONTROLS[dA] === dB)   dayRelationType = 'challenges';
  else if (CONTROLS[dB] === dA)   dayRelationType = 'challenged_by';
  else if (dA === dB)             dayRelationType = 'same';
  else                            dayRelationType = 'independent';

  let summaryKey: RawCompatibility['summaryKey'];
  if (score >= 80)      summaryKey = 'excellent';
  else if (score >= 65) summaryKey = 'strong';
  else if (score >= 50) summaryKey = 'moderate';
  else if (score >= 35) summaryKey = 'challenging';
  else                  summaryKey = 'tension';

  return { score, summaryKey, dayRelationType, dayElemA: dA, dayElemB: dB };
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: ReportSection; index: number }) {
  const colors = ['#7c3aed', '#a855f7', '#9333ea', '#6d28d9', '#8b5cf6'];
  return (
    <View style={sStyles.card}>
      <View style={[sStyles.accentBar, { backgroundColor: colors[index % colors.length] }]} />
      <View style={sStyles.body}>
        <Text style={sStyles.heading}>{section.heading}</Text>
        <Text style={sStyles.content}>{section.content}</Text>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#2d1854', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  accentBar: { width: 4 },
  body: { flex: 1, padding: 16 },
  heading: { fontSize: 14, fontWeight: '700', color: '#d8b4fe', marginBottom: 8 },
  content: { fontSize: 13, color: '#b8a9d9', lineHeight: 21 },
});

// ── Score card ────────────────────────────────────────────────────────────────

function ScoreCard({
  compat,
  hasFullAccess,
  onUnlock,
}: {
  compat: LocalCompatibility;
  hasFullAccess: boolean;
  onUnlock: () => void;
}) {
  const scoreColor = compat.score >= 70 ? '#22c55e' : compat.score >= 50 ? '#a78bfa' : '#ef4444';

  return (
    <View style={scoreStyles.card}>
      {/* Score ring area */}
      <View style={scoreStyles.scoreRow}>
        <View style={[scoreStyles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[scoreStyles.scoreNum, { color: scoreColor }]}>{compat.score}</Text>
          <Text style={scoreStyles.scoreMax}>/100</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={scoreStyles.summary}>{compat.summary}</Text>
          <Text style={[scoreStyles.dayRelation, { color: scoreColor }]}>{compat.dayRelation}</Text>
        </View>
      </View>

      {/* Gate CTA or full-report trigger */}
      {!hasFullAccess ? (
        <TouchableOpacity style={scoreStyles.ctaBtn} onPress={onUnlock}>
          <Text style={scoreStyles.ctaBtnText}>See why — Unlock full report $4.99</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card: { backgroundColor: '#2d1854', borderRadius: 20, padding: 20, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  scoreMax: { fontSize: 11, color: '#9d8fbe', fontWeight: '600' },
  summary: { color: '#fff', fontWeight: '700', fontSize: 15, lineHeight: 22, marginBottom: 6 },
  dayRelation: { fontSize: 12, fontWeight: '600' },
  ctaBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CompatibilityScreen() {
  const { t } = useTranslation('common');
  const { loading, report, error, generate, reset } = useAddonReport();
  const { addons } = useEntitlementStore();
  const { chart: userChart, frame } = useSajuStore();
  const hasFullAccess = DEV_BYPASS || addons.deepCompatibility;

  // Partner birth input
  const [pYear,   setPYear]   = useState('');
  const [pMonth,  setPMonth]  = useState('');
  const [pDay,    setPDay]    = useState('');
  const [pGender, setPGender] = useState<'M' | 'F'>('F');
  const [pIsLunar, setPIsLunar] = useState(LUNAR_FRAMES.has(frame ?? ''));
  const [inputError, setInputError] = useState<string | null>(null);

  // Local compatibility result (free tier)
  const [localCompat, setLocalCompat] = useState<LocalCompatibility | null>(null);
  const [partnerChart, setPartnerChart] = useState<{ chart: SajuChart; birthYear: number } | null>(null);

  function buildPartnerChart(): { chart: SajuChart; birthYear: number } | null {
    const yearRaw  = parseInt(pYear, 10);
    const monthRaw = parseInt(pMonth, 10);
    const dayRaw   = parseInt(pDay, 10);

    if (
      isNaN(yearRaw)  || yearRaw  < 1920 || yearRaw  > 2020 ||
      isNaN(monthRaw) || monthRaw < 1    || monthRaw > 12   ||
      isNaN(dayRaw)   || dayRaw   < 1    || dayRaw   > 31
    ) {
      setInputError('Please enter a valid birth date (year 1920–2020).');
      return null;
    }

    let year = yearRaw, month = monthRaw, day = dayRaw;
    if (pIsLunar) {
      const solar = lunarToSolar(yearRaw, monthRaw, dayRaw);
      if (!solar) {
        setInputError('Could not convert lunar date. Please check and try again.');
        return null;
      }
      year = solar.year; month = solar.month; day = solar.day;
    }
    setInputError(null);

    const birthData: BirthData = { year, month, day, gender: pGender };
    const pillars  = calculateFourPillars(birthData);
    const elements = calculateElementBalance(pillars);
    return {
      chart: { pillars, elements, dayStem: pillars.day.stem, dayElement: STEM_ELEMENT[pillars.day.stem]! },
      birthYear: year,
    };
  }

  function handleAnalyze() {
    const result = buildPartnerChart();
    if (!result) return;

    setPartnerChart(result);

    if (userChart) {
      const raw = calculateRawCompatibility(userChart, result.chart);
      setLocalCompat({
        score: raw.score,
        summary: t(`compatScore.${raw.summaryKey}`),
        dayRelation: t(`compatRelation.${raw.dayRelationType}`, {
          a: raw.dayElemA,
          b: raw.dayElemB,
        }),
      });
    }
  }

  async function handleFullReport() {
    if (!partnerChart) return;
    await generate({
      reportType: 'compatibility',
      partnerChart: partnerChart.chart,
      partnerBirthYear: partnerChart.birthYear,
    });
  }

  function handleReset() {
    setLocalCompat(null);
    setPartnerChart(null);
    setInputError(null);
    setPYear(''); setPMonth(''); setPDay('');
    setPIsLunar(LUNAR_FRAMES.has(frame ?? ''));
    reset();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>궁합</Text>
      <Text style={styles.subtitle}>궁합 · 合婚 · 관계 조화</Text>

      {/* Input form — shown when no result yet */}
      {!localCompat && !report && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>파트너 생년월일</Text>
          <Text style={styles.formHint}>
            파트너의 생년월일을 입력하면 오행 궁합 점수를 확인할 수 있습니다.
          </Text>

          {/* Lunar / Solar toggle */}
          <View style={styles.calendarToggle}>
            <TouchableOpacity
              style={[styles.calToggleBtn, pIsLunar && styles.calToggleBtnActive]}
              onPress={() => setPIsLunar(true)}
            >
              <Text style={[styles.calToggleText, pIsLunar && styles.calToggleTextActive]}>
                🌙 Lunar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.calToggleBtn, !pIsLunar && styles.calToggleBtnActive]}
              onPress={() => setPIsLunar(false)}
            >
              <Text style={[styles.calToggleText, !pIsLunar && styles.calToggleTextActive]}>
                ☀️ Solar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            {[
              { label: '년도', value: pYear, onChange: setPYear, maxLength: 4, placeholder: '1990' },
              { label: '월', value: pMonth, onChange: setPMonth, maxLength: 2, placeholder: '06' },
              { label: '일', value: pDay, onChange: setPDay, maxLength: 2, placeholder: '15' },
            ].map((f) => (
              <View key={f.label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.onChange}
                  keyboardType="number-pad"
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  placeholderTextColor="#5b4d7e"
                />
              </View>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16, marginBottom: 8 }]}>파트너 성별</Text>
          <View style={styles.genderRow}>
            {(['M', 'F'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, pGender === g && styles.genderBtnActive]}
                onPress={() => setPGender(g)}
              >
                <Text style={[styles.genderText, pGender === g && styles.genderTextActive]}>
                  {g === 'M' ? '♂ 남성' : '♀ 여성'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {inputError && <Text style={styles.errorText}>{inputError}</Text>}

          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
            <Text style={styles.analyzeBtnText}>궁합 확인하기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Free score result */}
      {localCompat && !report && (
        <>
          <ScoreCard
            compat={localCompat}
            hasFullAccess={hasFullAccess}
            onUnlock={() => router.push('/paywall')}
          />

          {/* Full report — addon users only */}
          {hasFullAccess && (
            <View style={styles.fullReportCard}>
              <Text style={styles.fullReportTitle}>Full AI 리포트</Text>
              <Text style={styles.fullReportDesc}>
                오행 조화, 강점, 긴장 관계, 관계 예측 등 5개 섹션으로 구성된 심층 분석 리포트입니다.
              </Text>
              {error && !loading ? (
                <View style={styles.comingSoonBox}>
                  <Text style={styles.comingSoonIcon}>🚧</Text>
                  <Text style={styles.comingSoonText}>{t('comingSoon')} — 준비 중입니다</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
                  onPress={handleFullReport}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.analyzeBtnText}>전체 리포트 생성</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>← 다른 사람 분석하기</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Full AI report results */}
      {report && (
        <>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportOverview}>{report.overview}</Text>
          </View>
          {report.sections.map((s, i) => (
            <SectionCard key={i} section={s} index={i} />
          ))}
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>다른 사람 분석하기 →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: '#a78bfa', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9d8fbe', marginBottom: 28 },

  formCard: { backgroundColor: '#2d1854', borderRadius: 20, padding: 22, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  formHint: { fontSize: 13, color: '#9d8fbe', lineHeight: 20, marginBottom: 16 },
  calendarToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a0a2e',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  calToggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  calToggleBtnActive: { backgroundColor: '#7c3aed' },
  calToggleText: { color: '#9d8fbe', fontWeight: '600', fontSize: 13 },
  calToggleTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#1a0a2e', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center',
    borderWidth: 1, borderColor: '#3d2471',
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#3d2471',
    alignItems: 'center', backgroundColor: '#1a0a2e',
  },
  genderBtnActive: { borderColor: '#7c3aed', backgroundColor: '#7c3aed22' },
  genderText: { color: '#9d8fbe', fontWeight: '600', fontSize: 14 },
  genderTextActive: { color: '#d8b4fe' },
  errorText: { color: '#f87171', fontSize: 13, marginTop: 12, textAlign: 'center' },
  analyzeBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  fullReportCard: {
    backgroundColor: '#2d1854', borderRadius: 16,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#4c1d95',
  },
  fullReportTitle: { color: '#d8b4fe', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  fullReportDesc: { color: '#9d8fbe', fontSize: 13, lineHeight: 20 },

  errorCard: { backgroundColor: '#2d1854', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16 },
  comingSoonBox: { alignItems: 'center', paddingVertical: 16 },
  comingSoonIcon: { fontSize: 28, marginBottom: 6 },
  comingSoonText: { color: '#9d8fbe', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  reportHeader: { marginBottom: 20 },
  reportTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  reportOverview: { fontSize: 15, color: '#b8a9d9', lineHeight: 24 },
  resetBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  resetBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
});
