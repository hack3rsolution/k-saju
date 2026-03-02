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
import { T } from '../../src/theme/tokens';

// ── Element palette ───────────────────────────────────────────────────────────

const ELEMENT_COLOR: Record<FiveElement, string> = T.element;

const ELEMENT_EMOJI: Record<FiveElement, string> = {
  木: '🌿',
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
      style={[{ width, height, backgroundColor: T.bg.elevated, borderRadius: T.radius.sm, opacity }, style]}
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
    backgroundColor: T.bg.base,
    borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[3],
    paddingVertical: T.spacing[2],
    gap: T.spacing[2],
    flex: 1,
    minWidth: '44%',
    borderWidth: 1,
    borderColor: T.border.default,
  },
  icon: { fontSize: 20 },
  label: { color: T.text.faint, fontSize: T.fontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  value: { color: T.text.primary, fontSize: T.fontSize.sm, fontWeight: '700' },
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

// ── Quick-action grid items ───────────────────────────────────────────────────

const GRID_ITEMS = [
  { label: 'Compatibility', icon: '💞', route: '/compatibility', deco: '合' },
  { label: 'Annual Report', icon: '📅', route: '/reports', deco: '年' },
  { label: 'My Chart', icon: '☯️', route: '/(tabs)/chart', deco: '命' },
  { label: 'Fortune', icon: '⭐', route: '/(tabs)/fortune', deco: '運' },
] as const;

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

  // ── Timing Advisor state ──────────────────────────────────────────────────
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
  const elementColor = ELEMENT_COLOR[todayElement] ?? T.primary.DEFAULT;
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

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={refresh} disabled={loading}>
              <Ionicons name="refresh" size={20} color={loading ? T.text.caption : T.primary.light} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShareVisible(true)}
              disabled={!reading && !chart}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
                size={20}
                color={reading || chart ? T.primary.light : T.text.caption}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Today's 간지 pill ── */}
        <View style={[styles.ganjiPill, { borderColor: elementColor + '88' }]}>
          {/* Left element indicator */}
          <View style={[styles.ganjiIndicator, { backgroundColor: elementColor }]} />
          <Text style={styles.ganjiEmoji}>{elementEmoji}</Text>
          <Text style={styles.ganjiText}>{ganji}</Text>
          <View style={[styles.elementBadge, { backgroundColor: elementColor + '22', borderColor: elementColor + '44' }]}>
            <Text style={[styles.elementBadgeText, { color: elementColor }]}>
              {ELEMENT_LABEL[todayElement]} Day
            </Text>
          </View>
        </View>

        {/* ── Fortune card ── */}
        <View style={styles.fortuneCard}>
          {/* Card top accent bar */}
          <View style={[styles.fortuneAccentBar, { backgroundColor: elementColor }]} />

          <View style={styles.fortuneCardInner}>
            <View style={styles.fortuneHeader}>
              <View>
                <Text style={styles.fortuneLabel}>TODAY'S FORTUNE · 日運</Text>
                <View style={[styles.dayBadge, { backgroundColor: elementColor + '22', borderColor: elementColor + '44' }]}>
                  <Text style={[styles.dayBadgeText, { color: elementColor }]}>{todayDay}</Text>
                </View>
              </View>
              {/* Decorative kanji watermark */}
              <Text style={[styles.fortuneDeco, { color: elementColor }]}>運</Text>
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
                {/* Decorative line divider */}
                <View style={styles.fortuneDivider}>
                  <View style={[styles.fortuneDividerLine, { backgroundColor: elementColor + '55' }]} />
                </View>

                <Text style={styles.fortuneSummary}>{reading.summary}</Text>
                {reading.details.map((d, i) => (
                  <View key={i} style={styles.detailRow}>
                    <View style={[styles.detailBullet, { backgroundColor: elementColor }]} />
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

                {/* "더 물어보기" button */}
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
        </View>

        {/* ── Lucky items ── */}
        {reading?.luckyItems && (
          <View style={styles.luckyCard}>
            <View style={styles.luckyHeader}>
              <Text style={styles.luckyTitle}>LUCKY TODAY</Text>
              <Text style={styles.luckyGlyph}>吉</Text>
            </View>
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

        {/* ── Free limit banner ── */}
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

        {/* ── Quick actions grid ── */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.75}
            >
              {/* Deco glyph watermark */}
              <Text style={styles.gridDeco}>{item.deco}</Text>
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Feedback Sheet ── */}
      <FeedbackSheet
        visible={sheetVisible}
        initialRating={selectedRating}
        submitting={feedbackSubmitting}
        onSelect={handleFeedbackSubmit}
        onClose={() => setSheetVisible(false)}
      />

      {/* ── Share Card Modal ── */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareVisible(false)}
      >
        <View style={mStyles.overlay}>
          <View style={mStyles.sheet}>
            <View style={mStyles.handle} />
            <Text style={mStyles.title}>Share Your Card</Text>
            <Text style={mStyles.subtitle}>Capture & share your cosmic destiny</Text>
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
            <TouchableOpacity style={mStyles.closeBtn} onPress={() => setShareVisible(false)}>
              <Text style={mStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Timing Advisor FAB ── */}
      <TouchableOpacity
        style={fabStyles.fab}
        onPress={handleTimingPress}
        activeOpacity={0.85}
      >
        <Text style={fabStyles.fabIcon}>⏰</Text>
        <Text style={fabStyles.fabLabel}>지금 결정 분석</Text>
      </TouchableOpacity>

      <TimingCategorySheet
        visible={categorySheetVisible}
        onSelect={handleCategorySelect}
        onClose={() => setCategorySheetVisible(false)}
      />
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
  container: { flex: 1, backgroundColor: T.bg.surface },
  content: { padding: T.spacing[6], paddingTop: 60, paddingBottom: T.spacing[8] },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: T.spacing[5] },
  greeting: { fontSize: T.fontSize['2xl'], fontWeight: '800', color: T.text.primary, letterSpacing: -0.3 },
  dateText: { fontSize: T.fontSize.sm, color: T.text.faint, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: T.spacing[2], marginTop: 4 },
  iconBtn: {
    padding: T.spacing[2],
    backgroundColor: T.bg.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.border.default,
  },

  // 간지 pill
  ganjiPill: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing[2],
    backgroundColor: T.bg.card, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[3],
    marginBottom: T.spacing[4], borderWidth: 1,
    overflow: 'hidden',
  },
  ganjiIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  ganjiEmoji: { fontSize: 18 },
  ganjiText: { fontSize: T.fontSize.base, color: T.text.secondary, fontWeight: '600', flex: 1, marginLeft: 6 },
  elementBadge: { borderRadius: T.radius.sm, paddingHorizontal: T.spacing[2], paddingVertical: 3, borderWidth: 1 },
  elementBadgeText: { fontSize: T.fontSize.xs, fontWeight: '700' },

  // Fortune card
  fortuneCard: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    marginBottom: T.spacing[4],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border.default,
  },
  fortuneAccentBar: { height: 3, width: '100%' },
  fortuneCardInner: { padding: T.spacing[5] },
  fortuneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: T.spacing[4] },
  fortuneLabel: { fontSize: T.fontSize.xs, color: T.primary.light, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  dayBadge: { borderRadius: T.radius.sm, paddingHorizontal: T.spacing[2], paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  dayBadgeText: { fontSize: T.fontSize.md, fontWeight: '700' },
  fortuneDeco: { fontSize: 56, fontWeight: '900', opacity: 0.1, lineHeight: 60 },

  // Decorative divider
  fortuneDivider: { marginBottom: T.spacing[4] },
  fortuneDividerLine: { height: 1, borderRadius: 1 },

  skeleton: { gap: 0 },
  fortuneSummary: { fontSize: T.fontSize.md, fontWeight: '700', color: T.text.primary, lineHeight: 26, marginBottom: T.spacing[4] },

  detailRow: { flexDirection: 'row', gap: T.spacing[3], marginBottom: T.spacing[2], alignItems: 'flex-start' },
  detailBullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  detailText: { flex: 1, fontSize: T.fontSize.base, color: T.text.muted, lineHeight: 22 },

  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing[2],
    marginTop: T.spacing[4], backgroundColor: T.bg.overlay, borderRadius: T.radius.md,
    paddingVertical: T.spacing[3], paddingHorizontal: T.spacing[4], alignSelf: 'flex-start',
    borderWidth: 1, borderColor: T.primary.subtle,
  },
  chatBtnLocked: { opacity: 0.8 },
  chatBtnIcon: { fontSize: 15 },
  chatBtnText: { color: T.primary.lighter, fontWeight: '600', fontSize: T.fontSize.base },
  chatBtnBadge: {
    backgroundColor: T.primary.DEFAULT, borderRadius: T.radius.sm,
    paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4,
  },
  chatBtnBadgeText: { color: '#fff', fontSize: T.fontSize.xs, fontWeight: '700' },

  errorBox: { alignItems: 'center', paddingVertical: T.spacing[2] },
  errorText: { color: T.semantic.error, fontSize: T.fontSize.base, marginBottom: T.spacing[3], textAlign: 'center' },
  retryBtn: { backgroundColor: T.primary.muted, borderRadius: T.radius.sm, paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[2] },
  retryText: { color: T.primary.light, fontWeight: '600' },

  lockedBox: { alignItems: 'center', paddingVertical: T.spacing[2] },
  lockedIcon: { fontSize: 28, marginBottom: T.spacing[2] },
  lockedTitle: { color: T.text.secondary, fontWeight: '700', fontSize: T.fontSize.md, marginBottom: 6 },
  lockedDesc: { color: T.text.muted, fontSize: T.fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Lucky card
  luckyCard: {
    backgroundColor: T.bg.card, borderRadius: T.radius.lg, padding: T.spacing[5],
    marginBottom: T.spacing[4], borderWidth: 1, borderColor: T.border.default,
  },
  luckyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing[3] },
  luckyTitle: { color: T.text.faint, fontSize: T.fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  luckyGlyph: { color: T.semantic.gold, fontSize: T.fontSize.lg, fontWeight: '800', opacity: 0.5 },
  luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing[2] },

  // Limit banners
  limitBannerUsed: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.bg.overlay, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[3],
    marginBottom: T.spacing[6], borderWidth: 1, borderColor: T.border.default,
  },
  limitBannerFree: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.bg.overlay, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[3],
    marginBottom: T.spacing[6], borderWidth: 1, borderColor: T.border.default,
  },
  limitUsedText: { color: T.primary.lighter, fontSize: T.fontSize.sm },
  limitFreeText: { color: T.primary.lighter, fontSize: T.fontSize.sm },
  upgradeLink: { color: T.primary.light, fontWeight: '700', fontSize: T.fontSize.sm },

  // Feedback
  feedbackRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: T.spacing[5], paddingTop: T.spacing[4],
    borderTopWidth: 1, borderTopColor: T.border.default,
  },
  feedbackLabel: { color: T.text.faint, fontSize: T.fontSize.sm, fontWeight: '600' },
  feedbackBtns: { flexDirection: 'row', gap: T.spacing[2] },
  feedbackBtn: {
    width: 40, height: 40, borderRadius: T.radius.md,
    backgroundColor: T.bg.base, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.border.default,
  },
  feedbackBtnActive: { borderColor: T.primary.light, backgroundColor: T.bg.elevated },
  feedbackBtnText: { fontSize: 18 },
  feedbackThanks: {
    marginTop: T.spacing[5], paddingTop: T.spacing[4],
    borderTopWidth: 1, borderTopColor: T.border.default, alignItems: 'center',
  },
  feedbackThanksText: { color: T.primary.light, fontSize: T.fontSize.sm, fontWeight: '600' },

  // Explore section
  sectionTitle: {
    fontSize: T.fontSize.lg, fontWeight: '700', color: T.text.primary,
    marginBottom: T.spacing[4], letterSpacing: -0.2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing[3] },
  gridItem: {
    backgroundColor: T.bg.card, borderRadius: T.radius.lg,
    padding: T.spacing[5], width: '47%', alignItems: 'center',
    borderWidth: 1, borderColor: T.border.default, overflow: 'hidden',
    position: 'relative',
  },
  gridDeco: {
    position: 'absolute', fontSize: 56, fontWeight: '900',
    color: T.primary.DEFAULT, opacity: 0.06,
    top: -8, right: 4,
  },
  gridIcon: { fontSize: 28, marginBottom: T.spacing[2], zIndex: 1 },
  gridLabel: { color: T.primary.lighter, fontWeight: '600', fontSize: T.fontSize.base, zIndex: 1 },
});

// ── FAB styles ────────────────────────────────────────────────────────────────

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: T.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing[2],
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius['2xl'],
    paddingVertical: T.spacing[4] - 2,
    paddingHorizontal: T.spacing[5],
    ...T.shadow.xl,
  },
  fabIcon: { fontSize: 18 },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.base },
});

// ── Modal styles ──────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    backgroundColor: T.bg.surface,
    borderTopLeftRadius: T.radius['2xl'],
    borderTopRightRadius: T.radius['2xl'],
    paddingHorizontal: T.spacing[6],
    paddingTop: T.spacing[4] - 2,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: T.border.default,
    borderRadius: 2,
    marginBottom: T.spacing[5],
  },
  title: { color: T.text.primary, fontSize: T.fontSize.xl, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: T.text.faint, fontSize: T.fontSize.sm, marginBottom: T.spacing[6] },
  cardContainer: {
    ...T.shadow.xl,
    marginBottom: T.spacing[7],
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing[2],
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius.lg,
    paddingVertical: 15,
    paddingHorizontal: T.spacing[8],
    width: '100%',
    justifyContent: 'center',
    marginBottom: T.spacing[3],
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.md },
  closeBtn: {
    paddingVertical: T.spacing[4] - 2,
    width: '100%',
    alignItems: 'center',
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border.default,
  },
  closeBtnText: { color: T.text.faint, fontWeight: '600', fontSize: T.fontSize.md },
});
