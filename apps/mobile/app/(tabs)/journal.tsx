/**
 * Journal Tab Screen — issue #21 (v2.0.0)
 *
 * Life event timeline with 대운/세운 overlay and AI pattern analysis.
 *  - Vertical timeline (카테고리별 아이콘)
 *  - FAB to add an event
 *  - AI analysis banner when events >= 5
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FortuneIcon, BookIcon, LockIcon } from '../../src/components/icons';
import { useJournal } from '../../src/hooks/useJournal';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { JournalEventCard } from '../../src/components/JournalEventCard';
import { AddEventModal } from '../../src/components/AddEventModal';
import { JournalAnalysisSheet } from '../../src/components/JournalAnalysisSheet';
import { useSajuStore } from '../../src/store/sajuStore';
import type { JournalAnalysisData, AddEventInput } from '../../src/types/journal';

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
  const { t } = useTranslation('common');
  const { daewoon, birthData } = useSajuStore();
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

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => { list(); }, [list]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(
    async (input: AddEventInput) => {
      const ok = await add(input);
      if (ok) {
        setAddVisible(false);
        // Invalidate analysis cache on new event
        setAnalysis(null);
      }
    },
    [add],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        t('journal.deleteTitle'),
        t('journal.deleteMessage'),
        [
          { text: t('journal.cancel'), style: 'cancel' },
          { text: t('journal.delete'), style: 'destructive', onPress: () => remove(id) },
        ],
      );
    },
    [remove, t],
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
        <ScreenHeader title={t('journal.title')} subtitle={t('journal.subtitle')} />

        {/* 대운/세운 overlay banner */}
        <View style={styles.cycleBanner}>
          <View style={styles.cycleChip}>
            <Text style={styles.cycleLabel}>{t('journal.annualLuck')}</Text>
            <Text style={styles.cycleValue}>{yearPillar}</Text>
          </View>
          {activeDaewoon && (
            <View style={styles.cycleChip}>
              <Text style={styles.cycleLabel}>{t('journal.majorLuck')}</Text>
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
            style={styles.analysisBanner}
            onPress={() => setAnalysisVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.analysisBannerIcon}><FortuneIcon color="#a78bfa" size={28} /></View>
            <View style={styles.analysisBannerText}>
              <Text style={styles.analysisBannerTitle}>{t('journal.analysisTitle')}</Text>
              <Text style={styles.analysisBannerDesc}>{t('journal.analysisDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#a78bfa" />
          </TouchableOpacity>
        )}

        {/* Locked analysis banner (< 5 events) */}
        {events.length > 0 && events.length < MIN_EVENTS_FOR_ANALYSIS && (
          <View style={styles.lockedAnalysis}>
            <LockIcon color="#9d8fbe" size={14} />
            <Text style={styles.lockedAnalysisText}>
              {t('journal.lockedAnalysis', { count: MIN_EVENTS_FOR_ANALYSIS - events.length })}
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
            <View style={styles.emptyIcon}><BookIcon color="#9d8fbe" size={48} /></View>
            <Text style={styles.emptyTitle}>{t('journal.emptyTitle')}</Text>
            <Text style={styles.emptyDesc}>{t('journal.emptyDesc')}</Text>
          </View>
        )}

        {/* Loading shimmer */}
        {loading && events.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingText}>{t('journal.loading')}</Text>
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
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  scroll:    { flex: 1 },
  content:   { padding: 24, paddingTop: 60, paddingBottom: 100 },

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
  analysisBannerIcon:  { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  analysisBannerText:  { flex: 1 },
  analysisBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  analysisBannerDesc:  { color: '#9d8fbe', fontSize: 12, marginTop: 2 },

  lockedAnalysis: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2d1854', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#3d2a6e',
  },
  lockedAnalysisText: { color: '#9d8fbe', fontSize: 13, textAlign: 'center' },

  errorBanner: { backgroundColor: '#ef444422', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:   { color: '#f87171', fontSize: 13, textAlign: 'center' },

  emptyBox:  { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
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
});
