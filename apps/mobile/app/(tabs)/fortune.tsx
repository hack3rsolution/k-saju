import { useRef, useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIsPremium } from '../../src/store/entitlementStore';
import { useFortune, type FortuneType } from '../../src/hooks/useFortune';
import { T } from '../../src/theme/tokens';
import {
  TodayIcon,
  WeekIcon,
  MonthIcon,
  AnnualReportIcon,
  MyChartIcon,
  ColorIcon,
  DirectionIcon,
  NumberIcon,
  FoodIcon,
  LockIcon,
} from '../../src/components/icons';

// ── Config ────────────────────────────────────────────────────────────────────

interface FortuneCard {
  key: FortuneType;
  labelKey: string;
  icon: ReactNode;
  premium: boolean;
}

const FORTUNE_CARDS: FortuneCard[] = [
  { key: 'daily',   labelKey: 'fortune.daily',   icon: <TodayIcon        color="#C9A84C" size={28} />, premium: false },
  { key: 'weekly',  labelKey: 'fortune.weekly',  icon: <WeekIcon         color="#C9A84C" size={28} />, premium: false },
  { key: 'monthly', labelKey: 'fortune.monthly', icon: <MonthIcon        color="#C9A84C" size={28} />, premium: true  },
  { key: 'annual',  labelKey: 'fortune.annual',  icon: <AnnualReportIcon color="#C9A84C" size={28} />, premium: true  },
  { key: 'daewoon', labelKey: 'fortune.daewoon', icon: <MyChartIcon      color="#C9A84C" size={28} />, premium: true  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ width, height }: { width: number | `${number}%`; height: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4,  duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{ width, height, backgroundColor: T.bg.elevated, borderRadius: T.radius.sm, opacity, marginBottom: 8 }}
    />
  );
}

// ── Reading panel (shown inside an expanded card) ─────────────────────────────

function ReadingPanel({ type }: { type: FortuneType }) {
  const { loading, reading, error, refresh } = useFortune(type);
  const { t } = useTranslation('common');

  if (loading) {
    return (
      <View style={styles.panel}>
        <Skeleton width="85%" height={18} />
        <Skeleton width="100%" height={13} />
        <Skeleton width="100%" height={13} />
        <Skeleton width="70%"  height={13} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelError}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!reading) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.panelDivider} />
      <Text style={styles.panelSummary}>{reading.summary}</Text>
      {reading.details.map((d, i) => (
        <View key={i} style={styles.panelRow}>
          <View style={styles.panelBullet} />
          <Text style={styles.panelDetail}>{d}</Text>
        </View>
      ))}
      {reading.luckyItems && (
        <View style={styles.luckyRow}>
          {reading.luckyItems.color && (
            <View style={styles.luckyChip}>
              <ColorIcon color="#C9A84C" size={12} />
              <Text style={styles.luckyChipText} numberOfLines={1} ellipsizeMode="tail">{reading.luckyItems.color}</Text>
            </View>
          )}
          {reading.luckyItems.number != null && (
            <View style={styles.luckyChip}>
              <NumberIcon color="#C9A84C" size={12} />
              <Text style={styles.luckyChipText} numberOfLines={1}>{reading.luckyItems.number}</Text>
            </View>
          )}
          {reading.luckyItems.direction && (
            <View style={styles.luckyChip}>
              <DirectionIcon color="#C9A84C" size={12} />
              <Text style={styles.luckyChipText} numberOfLines={1} ellipsizeMode="tail">{reading.luckyItems.direction}</Text>
            </View>
          )}
          {reading.luckyItems.food && (
            <View style={styles.luckyChip}>
              <FoodIcon color="#C9A84C" size={12} />
              <Text style={styles.luckyChipText} numberOfLines={1} ellipsizeMode="tail">{reading.luckyItems.food}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FortuneScreen() {
  const { t } = useTranslation('common');
  const isPremium = useIsPremium();
  const [expanded, setExpanded] = useState<FortuneType | null>(null);

  function handleCardPress(card: FortuneCard) {
    if (card.premium && !isPremium) {
      router.push('/paywall');
      return;
    }
    setExpanded(prev => (prev === card.key ? null : card.key));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('fortune.title')}</Text>
      <Text style={styles.subtitle}>{t('fortune.subtitle')}</Text>

      {FORTUNE_CARDS.map((card) => {
        const locked    = card.premium && !isPremium;
        const isOpen    = expanded === card.key;

        return (
          <TouchableOpacity
            key={card.key}
            style={[styles.card, isOpen && styles.cardOpen, locked && styles.cardLocked]}
            onPress={() => handleCardPress(card)}
            activeOpacity={0.8}
          >
            {/* Card header row */}
            <View style={styles.cardRow}>
              <View style={styles.cardIconWrap}>{card.icon}</View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{t(card.labelKey)}</Text>
                {locked && (
                  <Text style={styles.premiumBadge}>{t('fortune.premium')}</Text>
                )}
              </View>
              {locked
                ? <View style={styles.arrowWrap}><LockIcon color={T.text.faint} size={16} /></View>
                : <Text style={styles.arrow}>{isOpen ? '▲' : '→'}</Text>
              }
            </View>

            {/* Expanded reading panel */}
            {isOpen && !locked && <ReadingPanel type={card.key} />}
          </TouchableOpacity>
        );
      })}

      {!isPremium && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/paywall')}>
          <Text style={styles.upgradeBtnText}>{t('fortune.unlockAll')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg.surface },
  content:   { padding: T.spacing[6], paddingTop: 60, paddingBottom: T.spacing[8] },

  title:    { fontSize: T.fontSize['2xl'], fontWeight: '800', color: T.text.primary, marginBottom: 4 },
  subtitle: { fontSize: T.fontSize.sm, color: T.text.faint, marginBottom: T.spacing[5] },

  // Cards
  card: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    padding: T.spacing[5],
    marginBottom: T.spacing[3],
    borderWidth: 1,
    borderColor: T.border.default,
  },
  cardOpen:   { borderColor: T.primary.DEFAULT },
  cardLocked: { opacity: 0.7 },
  cardRow:    { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: { width: 28, height: 28, marginRight: T.spacing[4], alignItems: 'center', justifyContent: 'center' },
  cardBody:   { flex: 1 },
  cardTitle:  { color: T.text.primary, fontWeight: '600', fontSize: T.fontSize.md },
  premiumBadge: { color: T.primary.light, fontSize: T.fontSize.xs, fontWeight: '600', marginTop: 2 },
  arrow:      { color: T.text.faint, fontSize: T.fontSize.md },
  arrowWrap:  { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },

  // Reading panel (inside expanded card)
  panel:       { marginTop: T.spacing[4] },
  panelDivider:{ height: 1, backgroundColor: T.border.default, marginBottom: T.spacing[4] },
  panelSummary:{ fontSize: T.fontSize.base, fontWeight: '700', color: T.text.primary, lineHeight: 24, marginBottom: T.spacing[3] },
  panelRow:    { flexDirection: 'row', gap: T.spacing[3], marginBottom: T.spacing[2], alignItems: 'flex-start' },
  panelBullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, flexShrink: 0, backgroundColor: T.primary.DEFAULT },
  panelDetail: { flex: 1, fontSize: T.fontSize.sm, color: T.text.muted, lineHeight: 20 },
  panelError:  { color: T.semantic.error, fontSize: T.fontSize.sm, marginBottom: T.spacing[2] },

  luckyRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing[2], marginTop: T.spacing[3] },
  luckyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.bg.base, borderRadius: T.radius.sm,
    paddingHorizontal: T.spacing[2], paddingVertical: 4,
    borderWidth: 1, borderColor: T.border.default,
    maxWidth: '48%',
  },
  luckyChipText: {
    fontSize: T.fontSize.xs, color: T.text.secondary, fontWeight: '600',
    flexShrink: 1,
  },

  retryBtn:  { alignSelf: 'flex-start', paddingHorizontal: T.spacing[3], paddingVertical: T.spacing[2], borderRadius: T.radius.sm, borderWidth: 1, borderColor: T.border.default },
  retryText: { color: T.text.faint, fontSize: T.fontSize.xs, fontWeight: '600' },

  upgradeBtn:     { backgroundColor: T.primary.DEFAULT, borderRadius: T.radius.lg, paddingVertical: T.spacing[4], alignItems: 'center', marginTop: T.spacing[2] },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.base },
});
