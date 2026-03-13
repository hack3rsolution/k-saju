/**
 * JournalAnalysisSheet — AI pattern analysis bottom sheet.
 * Shown when user has >= 5 events.
 */
import { type ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { JournalAnalysisData, EventCategory } from '../types/journal';
import { CareerIcon, LoveIcon, HealthIcon, FamilyIcon, TravelIcon, FinanceIcon, BookIcon, EtcIcon, FortuneIcon } from './icons';

const CATEGORY_ICON: Record<EventCategory, ReactNode> = {
  career:    <CareerIcon  color="#a78bfa" size={20} />,
  love:      <LoveIcon    color="#a78bfa" size={20} />,
  health:    <HealthIcon  color="#a78bfa" size={20} />,
  family:    <FamilyIcon  color="#a78bfa" size={20} />,
  travel:    <TravelIcon  color="#a78bfa" size={20} />,
  finance:   <FinanceIcon color="#a78bfa" size={20} />,
  education: <BookIcon    color="#a78bfa" size={20} />,
  other:     <EtcIcon     color="#a78bfa" size={20} />,
};

interface Props {
  visible:     boolean;
  analysis:    JournalAnalysisData | null;
  loading:     boolean;
  error:       string | null;
  onClose:     () => void;
  onLoad:      () => void;
}

export function JournalAnalysisSheet({ visible, analysis, loading, error, onClose, onLoad }: Props) {
  const { t } = useTranslation('common');
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.heading}>{t('journal.analysisTitle')}</Text>
          <Text style={styles.subheading}>사주 흐름 × 인생 이벤트</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Not loaded yet */}
            {!analysis && !loading && !error && (
              <View style={styles.centerBox}>
                <View style={styles.promptIcon}><FortuneIcon color="#a78bfa" size={48} /></View>
                <Text style={styles.promptText}>{t('journal.analyzePrompt')}</Text>
                <TouchableOpacity style={styles.loadBtn} onPress={onLoad}>
                  <Text style={styles.loadBtnText}>{t('journal.analyzePatterns')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#a78bfa" size="large" />
                <Text style={styles.loadingText}>{t('journal.analyzingStory')}</Text>
              </View>
            )}

            {/* Error */}
            {error && !loading && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={onLoad}>
                  <Text style={styles.retryText}>{t('retry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Analysis result */}
            {analysis && !loading && (
              <>
                {/* Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionLabel}>{t('journal.overallPattern')}</Text>
                  <Text style={styles.summaryText}>{analysis.summary}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaChip}>⚡ {analysis.dominantElement}</Text>
                    <Text style={styles.metaChip}>📅 {analysis.eventCount} events</Text>
                  </View>
                </View>

                {/* Patterns */}
                {analysis.patterns.map((p, i) => (
                  <View key={i} style={styles.patternCard}>
                    <View style={styles.patternHeader}>
                      <View style={styles.patternIconWrap}>{CATEGORY_ICON[p.category]}</View>
                      <Text style={styles.patternCategory}>{p.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.patternDesc}>{p.description}</Text>
                    <View style={styles.periodRow}>
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodLabel}>{t('journal.bestPeriod')}</Text>
                        <Text style={styles.periodValue}>{p.bestPeriod}</Text>
                      </View>
                      <View style={[styles.periodBadge, styles.watchBadge]}>
                        <Text style={styles.periodLabel}>{t('journal.watchPeriod')}</Text>
                        <Text style={[styles.periodValue, styles.watchValue]}>{p.watchPeriod}</Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Cached note */}
                <Text style={styles.cacheNote}>{t('journal.cacheNote')}</Text>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000aa' },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#5b4d7e',
    alignSelf: 'center', marginBottom: 20,
  },
  heading:    { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subheading: { fontSize: 13, color: '#9d8fbe', marginBottom: 16 },
  scroll:     { marginBottom: 16 },

  centerBox: { alignItems: 'center', paddingVertical: 32 },
  promptIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  promptText: {
    color: '#9d8fbe', fontSize: 14, textAlign: 'center',
    lineHeight: 22, maxWidth: 280, marginBottom: 20,
  },
  loadBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingText: { color: '#9d8fbe', fontSize: 14, marginTop: 16 },

  errorBox:   { alignItems: 'center', paddingVertical: 24 },
  errorText:  { color: '#f87171', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn:   { backgroundColor: '#3d2a6e', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  retryText:  { color: '#a78bfa', fontWeight: '600' },

  summaryCard: {
    backgroundColor: '#2d1854', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  sectionLabel: { color: '#a78bfa', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  summaryText:  { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaChip: {
    backgroundColor: '#3d2a6e', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
    color: '#c4b5fd', fontSize: 12,
  },

  patternCard: {
    backgroundColor: '#2d1854', borderRadius: 16, padding: 16, marginBottom: 10,
  },
  patternHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  patternIconWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  patternCategory: { color: '#a78bfa', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  patternDesc:   { color: '#e2d9f3', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  periodRow:  { flexDirection: 'row', gap: 8 },
  periodBadge: {
    flex: 1, backgroundColor: '#1a3a2e', borderRadius: 10,
    padding: 8, alignItems: 'center',
  },
  watchBadge: { backgroundColor: '#3a1a1a' },
  periodLabel: { color: '#9d8fbe', fontSize: 11, marginBottom: 2 },
  periodValue: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  watchValue:  { color: '#f87171' },

  cacheNote: { color: '#5b4d7e', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 8 },

  closeBtn: {
    backgroundColor: '#2d1854', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  closeBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 15 },
});
