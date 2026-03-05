/**
 * fortune/[type].tsx — Premium fortune reading screen.
 * Route: /fortune/weekly  /fortune/monthly  /fortune/annual  /fortune/daewoon
 *
 * Fetches the requested reading type via the saju-reading Edge Function
 * and renders it with the same card UI as the home daily fortune card.
 */
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { FiveElement } from '@k-saju/saju-engine';
import { useFortune, type ReadingType } from '../../src/hooks/useFortune';
import { T } from '../../src/theme/tokens';

// ── Icon / deco per type (not localised) ─────────────────────────────────────

const TYPE_DECO: Record<ReadingType, { deco: string; icon: string }> = {
  daily:   { deco: '日', icon: '☀️' },
  weekly:  { deco: '週', icon: '📆' },
  monthly: { deco: '月', icon: '🌙' },
  annual:  { deco: '年', icon: '🎆' },
  daewoon: { deco: '運', icon: '♾️' },
};

const ELEMENT_COLOR: Record<FiveElement, string> = T.element;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FortuneReadingScreen() {
  const { t } = useTranslation(['common', 'fortune']);
  const { type } = useLocalSearchParams<{ type: string }>();

  const VALID = ['weekly', 'monthly', 'annual', 'daewoon'];
  const readingType: ReadingType = VALID.includes(type) ? (type as ReadingType) : 'weekly';

  const { loading, reading, error, ganji, todayDay, todayElement, refresh } = useFortune(readingType);

  const deco = TYPE_DECO[readingType];
  const elementColor = ELEMENT_COLOR[todayElement] ?? T.primary.DEFAULT;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={T.primary.light} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{deco.icon} {t(`fortune:types.${readingType}`)}</Text>
          <Text style={styles.ganji}>{ganji}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} disabled={loading}>
          <Ionicons name="refresh" size={18} color={loading ? T.text.caption : T.primary.light} />
        </TouchableOpacity>
      </View>

      {/* ── Reading card ── */}
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: elementColor }]} />
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>{t(`fortune:typeLabelCard.${readingType}`)}</Text>
              <View style={[styles.dayBadge, { backgroundColor: elementColor + '22', borderColor: elementColor + '44' }]}>
                <Text style={[styles.dayBadgeText, { color: elementColor }]}>{todayDay}</Text>
              </View>
            </View>
            <Text style={[styles.deco, { color: elementColor }]}>{deco.deco}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={T.primary.light} size="small" />
              <Text style={styles.loadingText}>{t('fortune:readingLoading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>{t('common:retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : reading ? (
            <>
              <View style={[styles.divider, { backgroundColor: elementColor + '55' }]} />
              <Text style={styles.summary}>{reading.summary}</Text>
              {reading.details.map((d, i) => (
                <View key={i} style={styles.detailRow}>
                  <View style={[styles.bullet, { backgroundColor: elementColor }]} />
                  <Text style={styles.detailText}>{d}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </View>

      {/* ── Lucky items ── */}
      {reading?.luckyItems && (
        <View style={styles.luckyCard}>
          <Text style={styles.luckyTitle}>{t('fortune:luckyItems.title')} · 吉</Text>
          <View style={styles.luckyGrid}>
            {reading.luckyItems.color && (
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>🎨</Text>
                <Text style={styles.pillLabel}>{t('fortune:luckyItems.color')}</Text>
                <Text style={styles.pillValue}>{reading.luckyItems.color}</Text>
              </View>
            )}
            {reading.luckyItems.number != null && (
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>🔢</Text>
                <Text style={styles.pillLabel}>{t('fortune:luckyItems.number')}</Text>
                <Text style={styles.pillValue}>{reading.luckyItems.number}</Text>
              </View>
            )}
            {reading.luckyItems.direction && (
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>🧭</Text>
                <Text style={styles.pillLabel}>{t('fortune:luckyItems.direction')}</Text>
                <Text style={styles.pillValue}>{reading.luckyItems.direction}</Text>
              </View>
            )}
            {reading.luckyItems.food && (
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>🍽️</Text>
                <Text style={styles.pillLabel}>{t('fortune:luckyItems.food')}</Text>
                <Text style={styles.pillValue}>{reading.luckyItems.food}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg.surface },
  content: { padding: T.spacing[6], paddingTop: 56, paddingBottom: T.spacing[8] },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: T.spacing[3],
    marginBottom: T.spacing[5],
  },
  backBtn: {
    padding: T.spacing[2], backgroundColor: T.bg.card,
    borderRadius: T.radius.md, borderWidth: 1, borderColor: T.border.default,
    marginTop: 2,
  },
  title: { fontSize: T.fontSize.xl, fontWeight: '700', color: T.text.primary },
  ganji: { fontSize: T.fontSize.xs, color: T.text.faint, marginTop: 3 },
  refreshBtn: {
    padding: T.spacing[2], backgroundColor: T.bg.card,
    borderRadius: T.radius.md, borderWidth: 1, borderColor: T.border.default,
    marginTop: 2,
  },

  card: {
    backgroundColor: T.bg.card, borderRadius: T.radius.xl,
    marginBottom: T.spacing[4], overflow: 'hidden',
    borderWidth: 1, borderColor: T.border.default,
  },
  accentBar: { height: 3, width: '100%' },
  cardInner: { padding: T.spacing[5] },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: T.spacing[4],
  },
  cardLabel: { fontSize: T.fontSize.xs, color: T.primary.light, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  dayBadge: { borderRadius: T.radius.sm, paddingHorizontal: T.spacing[2], paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  dayBadgeText: { fontSize: T.fontSize.md, fontWeight: '700' },
  deco: { fontSize: 56, fontWeight: '900', opacity: 0.1, lineHeight: 60 },

  loadingBox: { alignItems: 'center', paddingVertical: T.spacing[6], gap: T.spacing[3] },
  loadingText: { color: T.text.faint, fontSize: T.fontSize.sm },

  errorBox: { alignItems: 'center', paddingVertical: T.spacing[4] },
  errorText: { color: T.semantic.error, fontSize: T.fontSize.base, marginBottom: T.spacing[3], textAlign: 'center' },
  retryBtn: { backgroundColor: T.primary.muted, borderRadius: T.radius.sm, paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[2] },
  retryText: { color: T.primary.light, fontWeight: '600' },

  divider: { height: 1, borderRadius: 1, marginBottom: T.spacing[4] },
  summary: { fontSize: T.fontSize.md, fontWeight: '700', color: T.text.primary, lineHeight: 26, marginBottom: T.spacing[4] },
  detailRow: { flexDirection: 'row', gap: T.spacing[3], marginBottom: T.spacing[2], alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  detailText: { flex: 1, fontSize: T.fontSize.base, color: T.text.muted, lineHeight: 22 },

  luckyCard: {
    backgroundColor: T.bg.card, borderRadius: T.radius.lg, padding: T.spacing[5],
    marginBottom: T.spacing[4], borderWidth: 1, borderColor: T.border.default,
  },
  luckyTitle: { color: T.text.faint, fontSize: T.fontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: T.spacing[3] },
  luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing[2] },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing[2],
    backgroundColor: T.bg.base, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[3], paddingVertical: T.spacing[2],
    flex: 1, minWidth: '44%', borderWidth: 1, borderColor: T.border.default,
  },
  pillIcon: { fontSize: 18 },
  pillLabel: { color: T.text.faint, fontSize: T.fontSize.xs, fontWeight: '600' },
  pillValue: { color: T.text.primary, fontSize: T.fontSize.sm, fontWeight: '700' },
});
