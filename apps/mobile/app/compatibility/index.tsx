/**
 * Compatibility screen — Deep Compatibility Report (애드온).
 *
 * • Entitlement gate: addon.deepCompatibility (from entitlementStore)
 * • Partner birth date input → calculate partner chart → call addon-report
 * • Shows section-by-section results
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
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  STEM_ELEMENT,
  type BirthData,
  type SajuChart,
} from '@k-saju/saju-engine';
import { useAddonReport } from '../../src/hooks/useAddonReport';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import type { ReportSection } from '../../src/hooks/useAddonReport';

// ── Element color palette ──────────────────────────────────────────────────────

const ELEM_COLOR: Record<string, string> = {
  木: '#22c55e', 火: '#ef4444', 土: '#eab308', 金: '#94a3b8', 水: '#3b82f6',
};

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: ReportSection; index: number }) {
  const colors = ['#7c3aed', '#a855f7', '#9333ea', '#6d28d9', '#8b5cf6', '#7c3aed'];
  const accentColor = colors[index % colors.length];
  return (
    <View style={sStyles.card}>
      <View style={[sStyles.accentBar, { backgroundColor: accentColor }]} />
      <View style={sStyles.body}>
        <Text style={sStyles.heading}>{section.heading}</Text>
        <Text style={sStyles.content}>{section.content}</Text>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: 16 },
  heading: { fontSize: 14, fontWeight: '700', color: '#d8b4fe', marginBottom: 8 },
  content: { fontSize: 13, color: '#b8a9d9', lineHeight: 21 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CompatibilityScreen() {
  const { loading, report, error, generate, reset } = useAddonReport();
  const { addons } = useEntitlementStore();
  const isUnlocked = addons.deepCompatibility;

  // Partner birth input state
  const [pYear,   setPYear]   = useState('');
  const [pMonth,  setPMonth]  = useState('');
  const [pDay,    setPDay]    = useState('');
  const [pGender, setPGender] = useState<'M' | 'F'>('F');
  const [inputError, setInputError] = useState<string | null>(null);

  function buildPartnerChart(): { chart: SajuChart; birthYear: number } | null {
    const year  = parseInt(pYear, 10);
    const month = parseInt(pMonth, 10);
    const day   = parseInt(pDay, 10);

    if (
      isNaN(year)  || year  < 1920 || year  > 2020 ||
      isNaN(month) || month < 1    || month > 12   ||
      isNaN(day)   || day   < 1    || day   > 31
    ) {
      setInputError('Please enter a valid birth date (year 1920–2020).');
      return null;
    }
    setInputError(null);

    const birthData: BirthData = { year, month, day, gender: pGender };
    const pillars  = calculateFourPillars(birthData);
    const elements = calculateElementBalance(pillars);
    return {
      chart: {
        pillars,
        elements,
        dayStem: pillars.day.stem,
        dayElement: STEM_ELEMENT[pillars.day.stem],
      },
      birthYear: year,
    };
  }

  async function handleAnalyze() {
    const result = buildPartnerChart();
    if (!result) return;
    await generate({
      reportType: 'compatibility',
      partnerChart: result.chart,
      partnerBirthYear: result.birthYear,
    });
  }

  // ── Locked state ─────────────────────────────────────────────────────────

  if (!isUnlocked) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Compatibility</Text>
        <Text style={styles.subtitle}>궁합 · 合婚 · Relationship Harmony</Text>
        <View style={styles.lockCard}>
          <Text style={styles.lockIcon}>💞</Text>
          <Text style={styles.lockTitle}>Deep Compatibility Report</Text>
          <Text style={styles.lockDesc}>
            Unlock a full 합충형파 analysis of two charts, elemental harmony score,
            and a 5-year relationship forecast.
          </Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={() => router.push('/paywall')}>
            <Text style={styles.unlockBtnText}>Unlock — $4.99</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Unlocked state ────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Compatibility</Text>
      <Text style={styles.subtitle}>궁합 · 合婚 · Relationship Harmony</Text>

      {/* Partner input form */}
      {!report && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Partner's Birth Date</Text>
          <Text style={styles.formHint}>
            Enter your partner's birth information to compare charts.
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.input}
                value={pYear}
                onChangeText={setPYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="1990"
                placeholderTextColor="#5b4d7e"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                style={styles.input}
                value={pMonth}
                onChangeText={setPMonth}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="06"
                placeholderTextColor="#5b4d7e"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Day</Text>
              <TextInput
                style={styles.input}
                value={pDay}
                onChangeText={setPDay}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="15"
                placeholderTextColor="#5b4d7e"
              />
            </View>
          </View>

          {/* Gender toggle */}
          <Text style={[styles.inputLabel, { marginTop: 16, marginBottom: 8 }]}>Partner Gender</Text>
          <View style={styles.genderRow}>
            {(['M', 'F'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, pGender === g && styles.genderBtnActive]}
                onPress={() => setPGender(g)}
              >
                <Text style={[styles.genderText, pGender === g && styles.genderTextActive]}>
                  {g === 'M' ? '♂ Male' : '♀ Female'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {inputError && <Text style={styles.errorText}>{inputError}</Text>}

          <TouchableOpacity
            style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze Compatibility</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { reset(); }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {report && (
        <>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportOverview}>{report.overview}</Text>
          </View>

          {report.sections.map((s, i) => (
            <SectionCard key={i} section={s} index={i} />
          ))}

          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>Analyze Another Person →</Text>
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

  // Locked
  lockCard: {
    backgroundColor: '#2d1854',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  lockIcon: { fontSize: 48, marginBottom: 16 },
  lockTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  lockDesc: { fontSize: 14, color: '#b8a9d9', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  unlockBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  unlockBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Form
  formCard: { backgroundColor: '#2d1854', borderRadius: 20, padding: 22, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  formHint: { fontSize: 13, color: '#9d8fbe', lineHeight: 20, marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#1a0a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3d2471',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
  },
  genderBtnActive: { borderColor: '#7c3aed', backgroundColor: '#7c3aed22' },
  genderText: { color: '#9d8fbe', fontWeight: '600', fontSize: 14 },
  genderTextActive: { color: '#d8b4fe' },
  errorText: { color: '#f87171', fontSize: 13, marginTop: 12, textAlign: 'center' },
  analyzeBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Error card
  errorCard: {
    backgroundColor: '#2d1854',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#7c3aed33',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#a78bfa', fontWeight: '600' },

  // Report
  reportHeader: { marginBottom: 20 },
  reportTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  reportOverview: { fontSize: 15, color: '#b8a9d9', lineHeight: 24 },
  resetBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  resetBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
});
