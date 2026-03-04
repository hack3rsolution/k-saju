/**
 * Journal Tab Screen — issue #21 (v2.0.0)
 *
 * Life event timeline with 대운/세운 overlay and AI pattern analysis.
 *  - Vertical timeline (카테고리별 아이콘)
 *  - FAB to add an event
 *  - AI analysis banner when events >= 5
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '../../src/hooks/useJournal';
import { JournalEventCard } from '../../src/components/JournalEventCard';
import { AddEventModal } from '../../src/components/AddEventModal';
import { JournalAnalysisSheet } from '../../src/components/JournalAnalysisSheet';
import { useSajuStore } from '../../src/store/sajuStore';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import type { JournalAnalysisData, AddEventInput } from '../../src/types/journal';

const DEV_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MIN_EVENTS_FOR_ANALYSIS = 5;

// Current year sexagenary (simplified display)
function currentYearPillar(): string {
  const STEMS   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES= ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const yr = new Date().getFullYear();
  return STEMS[(yr - 4) % 10]! + BRANCHES[(yr - 4) % 12]!;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const { daewoon, birthData } = useSajuStore();
  const { isPremium } = useEntitlementStore();
  const effectivePremium = DEV_BYPASS || isPremium;
  const {
    events,
    loading,
    analysisLoading,
    error,
    list,
    add,
    remove,
    getAnalysis,
  } = useJournal();

  const [addVisible,      setAddVisible]      = useState(false);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [analysis,        setAnalysis]        = useState<JournalAnalysisData | null>(null);
  const [analysisError,   setAnalysisError]   = useState<string | null>(null);

  // ── Save toast ────────────────────────────────────────────────────────────
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showSavedToast = useCallback(() => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [toastOpacity]);

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => { list(); }, [list]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(
    async (input: AddEventInput) => {
      const ok = await add(input);
      if (ok) {
        setAddVisible(false);
        setAnalysis(null);
        showSavedToast();
        // Refresh list to confirm DB write (UUID fix means this now succeeds)
        list();
      }
    },
    [add, showSavedToast, list],
  );

  const handleDelete = useCallback(
    async (id: string) => { await remove(id); },
    [remove],
  );

  const handleLoadAnalysis = useCallback(async () => {
    setAnalysisError(null);
    const data = await getAnalysis();
    if (!data) {
      setAnalysisError(error ?? 'Analysis failed');
    } else {
      setAnalysis(data);
    }
  }, [getAnalysis, error]);

  // ── Active 대운 label ─────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const birthYear = birthData?.year ?? 1990;
  const currentAge = currentYear - birthYear;
  const activeDaewoon = daewoon.find(
    (d) => currentAge >= d.startAge && currentAge < d.startAge + 10,
  ) ?? daewoon[0];

  const yearPillar = currentYearPillar();

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={list} tintColor="#a78bfa" />}
      >
        {/* Header */}
        <Text style={styles.title}>인생 일지</Text>
        <Text style={styles.subtitle}>인생 이벤트 · 命運流</Text>

        {/* 대운/세운 overlay banner */}
        <View style={styles.cycleBanner}>
          <View style={styles.cycleChip}>
            <Text style={styles.cycleLabel}>歲運</Text>
            <Text style={styles.cycleValue}>{yearPillar}</Text>
          </View>
          {activeDaewoon && (
            <View style={styles.cycleChip}>
              <Text style={styles.cycleLabel}>大運</Text>
              <Text style={styles.cycleValue}>
                {activeDaewoon.pillar.stem}{activeDaewoon.pillar.branch}
              </Text>
            </View>
          )}
          <Text style={styles.cycleYear}>{currentYear}</Text>
        </View>

        {/* AI Analysis banner (unlocked at 5+ events) */}
        {events.length >= MIN_EVENTS_FOR_ANALYSIS && (
          <TouchableOpacity
            style={[styles.analysisBanner, !effectivePremium && styles.analysisBannerLocked]}
            onPress={() => {
              if (!effectivePremium) { router.push('/paywall'); return; }
              setAnalysisVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.analysisBannerIcon}>🔮</Text>
            <View style={styles.analysisBannerText}>
              <Text style={styles.analysisBannerTitle}>AI 패턴 분석</Text>
              <Text style={styles.analysisBannerDesc}>
                사주 사이클이 인생 이벤트에 미친 영향을 살펴보세요
              </Text>
            </View>
            {effectivePremium ? (
              <Ionicons name="chevron-forward" size={18} color="#a78bfa" />
            ) : (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Locked analysis banner (< 5 events) */}
        {events.length > 0 && events.length < MIN_EVENTS_FOR_ANALYSIS && (
          <View style={styles.lockedAnalysis}>
            <Text style={styles.lockedAnalysisText}>
              🔒 Add {MIN_EVENTS_FOR_ANALYSIS - events.length} more event{events.length < 4 ? 's' : ''} to unlock AI Pattern Analysis
            </Text>
          </View>
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>아직 기록된 이벤트가 없습니다</Text>
            <Text style={styles.emptyDesc}>
              커리어 변화, 인간관계, 건강 등 인생의 주요 순간을 기록하고 사주 패턴과의 연결을 찾아보세요.
            </Text>
          </View>
        )}

        {/* Loading shimmer */}
        {loading && events.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingText}>인생 일지 로딩 중…</Text>
          </View>
        )}

        {/* Timeline */}
        {events.length > 0 && (
          <View style={styles.timeline}>
            {events.map((event, idx) => (
              <JournalEventCard
                key={event.id}
                event={event}
                isLast={idx === events.length - 1}
                onDelete={() => handleDelete(event.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB — add event */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add modal */}
      <AddEventModal
        visible={addVisible}
        loading={loading}
        onClose={() => setAddVisible(false)}
        onSubmit={handleAdd}
      />

      {/* Analysis sheet */}
      <JournalAnalysisSheet
        visible={analysisVisible}
        analysis={analysis}
        loading={analysisLoading}
        error={analysisError}
        onClose={() => setAnalysisVisible(false)}
        onLoad={handleLoadAnalysis}
      />

      {/* Save success toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>✅ 이벤트가 저장되었습니다</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  scroll:    { flex: 1 },
  content:   { padding: 24, paddingTop: 60, paddingBottom: 100 },
  title:     { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subtitle:  { fontSize: 13, color: '#9d8fbe', marginBottom: 16 },

  cycleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2d1854', borderRadius: 14,
    padding: 12, marginBottom: 16,
  },
  cycleChip: {
    alignItems: 'center', backgroundColor: '#3d2a6e',
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
  },
  cycleLabel: { color: '#9d8fbe', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  cycleValue: { color: '#a78bfa', fontSize: 18, fontWeight: '700' },
  cycleYear:  { color: '#5b4d7e', fontSize: 13, marginLeft: 'auto' },

  analysisBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#2d1854', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#7c3aed',
  },
  analysisBannerLocked: { borderColor: '#3d2a6e' },
  analysisBannerIcon:  { fontSize: 28 },
  analysisBannerText:  { flex: 1 },
  analysisBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  analysisBannerDesc:  { color: '#9d8fbe', fontSize: 12, marginTop: 2 },
  premiumBadge: {
    backgroundColor: '#7c3aed', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  lockedAnalysis: {
    backgroundColor: '#2d1854', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#3d2a6e',
  },
  lockedAnalysisText: { color: '#9d8fbe', fontSize: 13, textAlign: 'center' },

  errorBanner: { backgroundColor: '#ef444422', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:   { color: '#f87171', fontSize: 13, textAlign: 'center' },

  emptyBox:  { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 8 },
  emptyDesc: { color: '#9d8fbe', fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  loadingBox:  { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#9d8fbe', fontSize: 14 },

  timeline: { paddingTop: 8 },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: '#22c55e', borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
