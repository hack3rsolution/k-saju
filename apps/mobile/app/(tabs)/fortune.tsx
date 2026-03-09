/**
 * fortune.tsx — Fortune Readings tab.
 *
 * Freemium gate strategy:
 *   Daily   → FREE (unlimited, drives daily retention)
 *   Weekly  → PREMIUM — preview card: first teaser sentence visible,
 *             rest blurred with "Unlock full access" upgrade banner
 *   Monthly / Annual / 大運 → PREMIUM (hard gate → paywall)
 *
 * DEV_BYPASS: EXPO_PUBLIC_ENABLE_DEV_BYPASS=true unlocks all in dev.
 */
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import { T } from '../../src/theme/tokens';

const DEV_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';

// ── Period type keys ──────────────────────────────────────────────────────────

const PERIOD_TYPES = ['daily', 'weekly', 'monthly', 'annual', 'daewoon'] as const;
type PeriodType = typeof PERIOD_TYPES[number];

const PERIOD_META: Record<PeriodType, { icon: string; deco: string; free?: boolean; premium?: boolean; hasPreview?: boolean }> = {
  daily:   { icon: '☀️', deco: '日', free: true },
  weekly:  { icon: '📆', deco: '週', premium: true, hasPreview: true },
  monthly: { icon: '🌙', deco: '月', premium: true },
  annual:  { icon: '🎆', deco: '年', premium: true },
  daewoon: { icon: '♾️', deco: '運', premium: true },
};

// ── Weekly preview card ───────────────────────────────────────────────────────

function WeeklyPreviewCard() {
  const { t } = useTranslation('fortune');
  const meta = PERIOD_META.weekly;
  return (
    <View style={previewStyles.card}>
      <View style={previewStyles.accentBar} />

      <View style={previewStyles.body}>
        <View style={previewStyles.headerRow}>
          <Text style={previewStyles.icon}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={previewStyles.label}>{t('weeklyLabel')}</Text>
            <Text style={previewStyles.title}>{t('periodLabel.weekly')}</Text>
          </View>
          <Text style={previewStyles.deco}>{meta.deco}</Text>
        </View>

        <Text style={previewStyles.teaser}>{t('weeklyTeaser')}</Text>

        <View style={previewStyles.blurWrap}>
          <View style={previewStyles.blurLines}>
            <View style={[previewStyles.blurLine, { width: '100%' }]} />
            <View style={[previewStyles.blurLine, { width: '85%' }]} />
            <View style={[previewStyles.blurLine, { width: '92%' }]} />
            <View style={[previewStyles.blurLine, { width: '70%' }]} />
          </View>
          <View style={previewStyles.fadeOverlay} pointerEvents="none" />
        </View>

        <View style={previewStyles.ctaRow}>
          <TouchableOpacity
            style={previewStyles.ctaBtn}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.85}
          >
            <Text style={previewStyles.ctaBtnText}>{t('unlockWeekly')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Standard period card ──────────────────────────────────────────────────────

function PeriodCard({ type, unlocked }: { type: PeriodType; unlocked: boolean }) {
  const { t } = useTranslation('fortune');
  const meta = PERIOD_META[type];

  function handlePress() {
    if (!unlocked) {
      router.push('/paywall');
      return;
    }
    if (type === 'daily') {
      router.push('/(tabs)/home');
    } else {
      router.push(`/fortune/${type}` as never);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, !unlocked && styles.cardLocked]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={styles.cardIcon}>{meta.icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{t(`periodLabel.${type}`)}</Text>
        <Text style={styles.cardDesc}>{t(`periodDesc.${type}`)}</Text>
        {!unlocked && meta.premium && (
          <Text style={styles.premiumBadge}>Premium</Text>
        )}
      </View>
      <Text style={styles.arrow}>{unlocked ? '→' : '🔒'}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FortuneScreen() {
  const { t } = useTranslation('fortune');
  const { isPremium } = useEntitlementStore();
  const effectivePremium = DEV_BYPASS || isPremium;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('readingsTitle')}</Text>
      <Text style={styles.subtitle}>{t('luckCycles')}</Text>

      {PERIOD_TYPES.map((type) => {
        const meta = PERIOD_META[type];
        const unlocked = effectivePremium || !meta.premium;

        // Weekly: show preview card for non-premium users
        if (meta.hasPreview && !effectivePremium) {
          return <WeeklyPreviewCard key={type} />;
        }

        return <PeriodCard key={type} type={type} unlocked={unlocked} />;
      })}

      {/* Upgrade banner for free users */}
      {!effectivePremium && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/paywall')}>
          <Text style={styles.upgradeBtnText}>{t('unlockAll')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg.surface },
  content: { padding: T.spacing[6], paddingTop: 60, paddingBottom: T.spacing[8] },
  title: { fontSize: T.fontSize['2xl'], fontWeight: '700', color: T.text.primary, marginBottom: 4 },
  subtitle: { fontSize: T.fontSize.sm, color: T.text.faint, marginBottom: T.spacing[6] },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg.card,
    borderRadius: T.radius.lg,
    padding: T.spacing[5],
    marginBottom: T.spacing[3],
    borderWidth: 1,
    borderColor: T.border.default,
  },
  cardLocked: { opacity: 0.65 },
  cardIcon: { fontSize: 28, marginRight: T.spacing[4] },
  cardBody: { flex: 1 },
  cardTitle: { color: T.text.primary, fontWeight: '600', fontSize: T.fontSize.md },
  cardDesc: { color: T.text.faint, fontSize: T.fontSize.xs, marginTop: 2 },
  premiumBadge: {
    color: T.primary.light,
    fontSize: T.fontSize.xs,
    marginTop: 4,
    fontWeight: '600',
  },
  arrow: { color: T.text.faint, fontSize: 18 },

  upgradeBtn: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing[4],
    alignItems: 'center',
    marginTop: T.spacing[2],
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.base },
});

// ── Weekly preview card styles ────────────────────────────────────────────────

const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    marginBottom: T.spacing[3],
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: T.primary.muted,
  },
  accentBar: {
    height: 3,
    backgroundColor: T.primary.DEFAULT,
    width: '100%',
  },
  body: { padding: T.spacing[5] },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: T.spacing[4],
    gap: T.spacing[3],
  },
  icon: { fontSize: 26, marginTop: 2 },
  label: { fontSize: T.fontSize.xs, color: T.primary.light, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: T.fontSize.md, color: T.text.primary, fontWeight: '700' },
  deco: { fontSize: 48, color: T.primary.DEFAULT, opacity: 0.12, fontWeight: '900', lineHeight: 52 },

  teaser: {
    fontSize: T.fontSize.base,
    color: T.text.secondary,
    lineHeight: 22,
    marginBottom: T.spacing[3],
    fontStyle: 'italic',
  },

  blurWrap: {
    position: 'relative',
    marginBottom: T.spacing[3],
  },
  blurLines: { gap: T.spacing[2] },
  blurLine: {
    height: 12,
    backgroundColor: T.bg.elevated,
    borderRadius: T.radius.sm,
    opacity: 0.6,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: T.bg.card,
    opacity: 0.85,
  },

  ctaRow: { marginTop: T.spacing[2] },
  ctaBtn: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius.md,
    paddingVertical: T.spacing[3] + 2,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.base },
});
