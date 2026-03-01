import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { FiveElement } from '@k-saju/saju-engine';
import { useFortune } from '../../src/hooks/useFortune';
import { useSajuStore } from '../../src/store/sajuStore';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import { ShareCard } from '../../src/components/ShareCard';
import { FeedbackSheet } from '../../src/components/FeedbackSheet';
import { useFeedback, type FeedbackRating, type FeedbackType } from '../../src/hooks/useFeedback';
import { TimingCategorySheet } from '../../src/components/TimingCategorySheet';
import { TimingResultSheet } from '../../src/components/TimingResultSheet';
import { useTimingAdvisor } from '../../src/hooks/useTimingAdvisor';
import type { TimingCategory } from '../../src/types/timing';

// ── Element palette ───────────────────────────────────────────────────────────

const ELEMENT_COLOR: Record<FiveElement, string> = {
  木: '#22c55e',
  火: '#ef4444',
  土: '#eab308',
  金: '#94a3b8',
  水: '#3b82f6',
};

const ELEMENT_EMOJI: Record<FiveElement, string> = {
  木: '🌱',
  火: '🔥',
  土: '⛰️',
  金: '✦',
  水: '🌊',
};

const ELEMENT_LABEL: Record<FiveElement, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: '#3d2471', borderRadius: 8, opacity }, style]}
    />
  );
}

// ── Lucky item pill ───────────────────────────────────────────────────────────

function LuckyPill({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <View style={lStyles.pill}>
      <Text style={lStyles.icon}>{icon}</Text>
      <View>
        <Text style={lStyles.label}>{label}</Text>
        <Text style={lStyles.value}>{String(value)}</Text>
      </View>
    </View>
  );
}

const lStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flex: 1,
    minWidth: '44%',
  },
  icon: { fontSize: 20 },
  label: { color: '#9d8fbe', fontSize: 10, fontWeight: '600' },
  value: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ── Greeting helpers ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const {
    loading,
    reading,
    readingId,
    error,
    ganji,
    todayDay,
    todayElement,
    weeklyLimitReached,
    refresh,
  } = useFortune();

  const { chart, frame } = useSajuStore();
  const { isPremium } = useEntitlementStore();

  // ── Feedback state ────────────────────────────────────────────────────────
  const { submitting: feedbackSubmitting, submitted: feedbackSubmitted, submitFeedback, reset: resetFeedback } = useFeedback();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null);

  function handleFeedbackPress(rating: FeedbackRating) {
    setSelectedRating(rating);
    setSheetVisible(true);
  }

  async function handleFeedbackSubmit(feedbackType: FeedbackType) {
    if (!selectedRating) return;
    await submitFeedback(readingId, selectedRating, feedbackType);
    setSheetVisible(false);
  }

  // ── Timing Advisor state ───────────────────────────────────────────────────
  const { loading: timingLoading, advice, limitReached, error: timingError, analyze, reset: resetTiming } = useTimingAdvisor();
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [resultSheetVisible, setResultSheetVisible] = useState(false);

  function handleTimingPress() {
    resetTiming();
    setCategorySheetVisible(true);
  }

  async function handleCategorySelect(category: TimingCategory) {
    setCategorySheetVisible(false);
    setResultSheetVisible(true);
    await analyze(category);
  }

  // ── Share card state ──────────────────────────────────────────────────────
  const [shareVisible, setShareVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cardRef = useRef<View>(null);

  async function handleShareImage() {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your K-Saju card',
        });
      }
    } catch (e) {
      console.warn('Share capture failed:', e);
    } finally {
      setCapturing(false);
    }
  }

  // ── Element helpers ───────────────────────────────────────────────────────
  const elementColor = ELEMENT_COLOR[todayElement] ?? '#7c3aed';
  const elementEmoji = ELEMENT_EMOJI[todayElement] ?? '✦';

  // ── Share card data ───────────────────────────────────────────────────────
  const shareFrame = frame ?? 'en';
  const shareDayStem = chart?.pillars.day.stem ?? '甲';
  const shareDayBranch = chart?.pillars.day.branch ?? '子';
  const shareDayElement = chart?.dayElement ?? todayElement;
  const shareSummary = reading?.summary ?? 'Your K-Saju destiny awaits…';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={refresh} disabled={loading}>
              <Ionicons name="refresh" size={20} color={loading ? '#5a4d7a' : '#a78bfa'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShareVisible(true)}
              disabled={!reading && !chart}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
                size={20}
                color={reading || chart ? '#a78bfa' : '#5a4d7a'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's 간지 pill */}
        <View style={[styles.ganjiPill, { borderColor: elementColor }]}>
          <Text style={styles.ganjiEmoji}>{elementEmoji}</Text>
          <Text style={styles.ganjiText}>{ganji}</Text>
          <View style={[styles.elementBadge, { backgroundColor: elementColor + '33' }]}>
            <Text style={[styles.elementBadgeText, { color: elementColor }]}>
              {ELEMENT_LABEL[todayElement]} Day
            </Text>
          </View>
        </View>

        {/* Fortune card */}
        <View style={styles.fortuneCard}>
          <View style={styles.fortuneHeader}>
            <Text style={styles.fortuneLabel}>Today's Fortune · 日運</Text>
            <View style={[styles.dayBadge, { backgroundColor: elementColor + '22' }]}>
              <Text style={[styles.dayBadgeText, { color: elementColor }]}>{todayDay}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.skeleton}>
              <Skeleton width="90%" height={22} style={{ marginBottom: 14 }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="75%" height={14} />
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : weeklyLimitReached && !reading ? (
            <View style={styles.lockedBox}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>Weekly reading used</Text>
              <Text style={styles.lockedDesc}>
                Your free reading for this week has been used. Upgrade to Premium for unlimited daily readings.
              </Text>
            </View>
          ) : reading ? (
            <>
              <Text style={styles.fortuneSummary}>{reading.summary}</Text>
              {reading.details.map((d, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={[styles.detailBullet, { color: elementColor }]}>·</Text>
                  <Text style={styles.detailText}>{d}</Text>
                </View>
              ))}
              {/* Feedback row */}
              {feedbackSubmitted ? (
                <View style={styles.feedbackThanks}>
                  <Text style={styles.feedbackThanksText}>✨ 감사합니다! 피드백이 반영됩니다.</Text>
                </View>
              ) : (
                <View style={styles.feedbackRow}>
                  <Text style={styles.feedbackLabel}>도움이 됐나요?</Text>
                  <View style={styles.feedbackBtns}>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, selectedRating === 1 && styles.feedbackBtnActive]}
                      onPress={() => handleFeedbackPress(1)}
                    >
                      <Text style={styles.feedbackBtnText}>👍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, selectedRating === -1 && styles.feedbackBtnActive]}
                      onPress={() => handleFeedbackPress(-1)}
                    >
                      <Text style={styles.feedbackBtnText}>👎</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* ── "더 물어보기" button ──────────────────────────────────── */}
              <TouchableOpacity
                style={[styles.chatBtn, !isPremium && styles.chatBtnLocked]}
                onPress={() => {
                  const today = new Date().toISOString().split('T')[0];
                  router.push({
                    pathname: '/fortune-chat/[fortuneId]',
                    params: {
                      fortuneId: today,
                      summary: reading.summary,
                      details: JSON.stringify(reading.details),
                    },
                  } as never);
                }}
              >
                <Text style={styles.chatBtnIcon}>💬</Text>
                <Text style={styles.chatBtnText}>더 물어보기</Text>
                {!isPremium && (
                  <View style={styles.chatBtnBadge}>
                    <Text style={styles.chatBtnBadgeText}>Premium</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Lucky items */}
        {reading?.luckyItems && (
          <View style={styles.luckyCard}>
            <Text style={styles.luckyTitle}>Lucky Today</Text>
            <View style={styles.luckyGrid}>
              {reading.luckyItems.color && (
                <LuckyPill icon="🎨" label="Color" value={reading.luckyItems.color} />
              )}
              {reading.luckyItems.number != null && (
                <LuckyPill icon="🔢" label="Number" value={reading.luckyItems.number} />
              )}
              {reading.luckyItems.direction && (
                <LuckyPill icon="🧭" label="Direction" value={reading.luckyItems.direction} />
              )}
              {reading.luckyItems.food && (
                <LuckyPill icon="🍽️" label="Food" value={reading.luckyItems.food} />
              )}
            </View>
          </View>
        )}

        {/* Free limit banner */}
        {weeklyLimitReached ? (
          <TouchableOpacity style={styles.limitBannerUsed} onPress={() => router.push('/paywall')}>
            <Text style={styles.limitUsedText}>Weekly free reading used · </Text>
            <Text style={styles.upgradeLink}>Upgrade to Premium →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.limitBannerFree}>
            <Text style={styles.limitFreeText}>🎁 1 free reading available this week</Text>
            <TouchableOpacity onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeLink}>Upgrade →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.grid}>
          {([
            { label: 'Compatibility', icon: '💞', route: '/compatibility' },
            { label: 'Annual Report', icon: '📅', route: '/reports' },
            { label: 'My Chart', icon: '☯️', route: '/(tabs)/chart' },
            { label: 'Fortune', icon: '⭐', route: '/(tabs)/fortune' },
          ] as const).map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => router.push(item.route as never)}
            >
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Feedback Sheet ───────────────────────────────────────────────────── */}
      <FeedbackSheet
        visible={sheetVisible}
        initialRating={selectedRating}
        submitting={feedbackSubmitting}
        onSelect={handleFeedbackSubmit}
        onClose={() => setSheetVisible(false)}
      />

      {/* ── Share Card Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareVisible(false)}
      >
        <View style={mStyles.overlay}>
          <View style={mStyles.sheet}>
            {/* Handle bar */}
            <View style={mStyles.handle} />

            <Text style={mStyles.title}>Share Your Card</Text>
            <Text style={mStyles.subtitle}>Capture & share your cosmic destiny</Text>

            {/* Card preview */}
            <View style={mStyles.cardContainer}>
              <ShareCard
                ref={cardRef}
                frame={shareFrame}
                dayStem={shareDayStem}
                dayBranch={shareDayBranch}
                dayElement={shareDayElement}
                ganji={ganji}
                summary={shareSummary}
              />
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={[mStyles.primaryBtn, capturing && mStyles.btnDisabled]}
              onPress={handleShareImage}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={18} color="#fff" />
                  <Text style={mStyles.primaryBtnText}>Share as Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={mStyles.closeBtn}
              onPress={() => setShareVisible(false)}
            >
              <Text style={mStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Timing Advisor FAB ───────────────────────────────────────────────── */}
      <TouchableOpacity
        style={fabStyles.fab}
        onPress={handleTimingPress}
        activeOpacity={0.85}
      >
        <Text style={fabStyles.fabIcon}>⏰</Text>
        <Text style={fabStyles.fabLabel}>지금 결정 분석</Text>
      </TouchableOpacity>

      {/* ── Timing Category Sheet ────────────────────────────────────────────── */}
      <TimingCategorySheet
        visible={categorySheetVisible}
        onSelect={handleCategorySelect}
        onClose={() => setCategorySheetVisible(false)}
      />

      {/* ── Timing Result Sheet ──────────────────────────────────────────────── */}
      <TimingResultSheet
        visible={resultSheetVisible}
        loading={timingLoading}
        advice={advice}
        limitReached={limitReached}
        error={timingError}
        onClose={() => { setResultSheetVisible(false); resetTiming(); }}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  dateText: { fontSize: 13, color: '#9d8fbe', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { padding: 8, backgroundColor: '#2d1854', borderRadius: 10 },
  ganjiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2d1854', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1,
  },
  ganjiEmoji: { fontSize: 16 },
  ganjiText: { fontSize: 14, color: '#e9d5ff', fontWeight: '600', flex: 1 },
  elementBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  elementBadgeText: { fontSize: 11, fontWeight: '700' },
  fortuneCard: { backgroundColor: '#2d1854', borderRadius: 20, padding: 22, marginBottom: 14 },
  fortuneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fortuneLabel: { fontSize: 11, color: '#a78bfa', fontWeight: '700', letterSpacing: 0.8 },
  dayBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeText: { fontSize: 13, fontWeight: '700' },
  skeleton: { gap: 0 },
  fortuneSummary: { fontSize: 17, fontWeight: '700', color: '#fff', lineHeight: 26, marginBottom: 14 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  detailBullet: { fontSize: 18, lineHeight: 22, fontWeight: '700' },
  detailText: { flex: 1, fontSize: 14, color: '#b8a9d9', lineHeight: 22 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, backgroundColor: '#3b1f6e', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#7c3aed44',
  },
  chatBtnLocked: { opacity: 0.8 },
  chatBtnIcon: { fontSize: 16 },
  chatBtnText: { color: '#d8b4fe', fontWeight: '600', fontSize: 14 },
  chatBtnBadge: {
    backgroundColor: '#7c3aed', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4,
  },
  chatBtnBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  errorBox: { alignItems: 'center', paddingVertical: 8 },
  errorText: { color: '#f87171', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7c3aed33', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#a78bfa', fontWeight: '600' },
  lockedBox: { alignItems: 'center', paddingVertical: 8 },
  lockedIcon: { fontSize: 28, marginBottom: 8 },
  lockedTitle: { color: '#e9d5ff', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  lockedDesc: { color: '#b8a9d9', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  luckyCard: { backgroundColor: '#2d1854', borderRadius: 16, padding: 18, marginBottom: 14 },
  luckyTitle: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  limitBannerUsed: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#3b1f6e', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  limitBannerFree: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#3b1f6e', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  limitUsedText: { color: '#d8b4fe', fontSize: 13 },
  limitFreeText: { color: '#d8b4fe', fontSize: 13 },
  upgradeLink: { color: '#a78bfa', fontWeight: '700', fontSize: 13 },
  // Feedback
  feedbackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#3d2471' },
  feedbackLabel: { color: '#9d8fbe', fontSize: 13, fontWeight: '600' },
  feedbackBtns: { flexDirection: 'row', gap: 8 },
  feedbackBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1a0a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3d2471' },
  feedbackBtnActive: { borderColor: '#a78bfa', backgroundColor: '#3d2471' },
  feedbackBtnText: { fontSize: 18 },
  feedbackThanks: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#3d2471', alignItems: 'center' },
  feedbackThanksText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { backgroundColor: '#2d1854', borderRadius: 16, padding: 20, width: '47%', alignItems: 'center' },
  gridIcon: { fontSize: 28, marginBottom: 8 },
  gridLabel: { color: '#d8b4fe', fontWeight: '600', fontSize: 14 },
});

// ── FAB styles ────────────────────────────────────────────────────────────────

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: { fontSize: 18 },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ── Modal styles ──────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#3d2471',
    borderRadius: 2,
    marginBottom: 20,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#9d8fbe', fontSize: 13, marginBottom: 24 },
  cardContainer: {
    // Shadow wrapper so the card looks elevated
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeBtn: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  closeBtnText: { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
});
