/**
 * ElementRoutineCard — 오행 에너지 기반 데일리 루틴 카드
 *
 * 세 탭(🍽️ Nourish / 🎨 Wear / 🏃 Move)으로 음식·색상·활동 추천을 표시.
 * Free: 명상 텍스트 + 색상 공개 / 음식·활동은 블러 + "Unlock" CTA
 * Premium: 전체 표시
 * 공유: captureRef → expo-sharing (PNG)
 */
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { T } from '../../theme/tokens';
import { RoutineShareCard } from './RoutineShareCard';
import type { DailyRoutineData, RoutineElement, FoodItem, ColorItem, ActivityItem } from '../../hooks/useDailyRoutine';

// ── Element theme (스타일만, 텍스트는 i18n) ──────────────────────────────────

const ELEMENT_THEME: Record<RoutineElement, { accent: string; tint: string; emoji: string }> = {
  Wood:  { accent: '#22c55e', tint: '#22c55e18', emoji: '🌱' },
  Fire:  { accent: '#ef4444', tint: '#ef444418', emoji: '🔥' },
  Earth: { accent: '#eab308', tint: '#eab30818', emoji: '🌾' },
  Metal: { accent: '#94a3b8', tint: '#94a3b818', emoji: '⚡' },
  Water: { accent: '#3b82f6', tint: '#3b82f618', emoji: '💧' },
};

// ── Tab key type ──────────────────────────────────────────────────────────────

type Tab = 'nourish' | 'wear' | 'move';

const TAB_ICONS: Record<Tab, string> = {
  nourish: '🍽️',
  wear:    '🎨',
  move:    '🏃',
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ width, height = 14, style }: { width: number | string; height?: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
    ]),
  ).start();

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: T.bg.elevated, borderRadius: T.radius.sm, opacity }, style]}
    />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ElementRoutineCardProps {
  data:      DailyRoutineData | null;
  isLoading: boolean;
  isPremium: boolean;
  onShare?:  () => void;
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function NourishView({ foods, locked }: { foods: FoodItem[]; locked: boolean }) {
  const { t } = useTranslation('common');
  if (locked) {
    return (
      <View style={s.lockedWrap}>
        <Text style={s.lockedEmoji}>🔒</Text>
        <Text style={s.lockedText}>{t('dailyRoutine.unlockFull')}</Text>
        <TouchableOpacity style={s.lockedBtn} onPress={() => router.push('/paywall')}>
          <Text style={s.lockedBtnText}>{t('dailyRoutine.goPremium')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={s.listWrap}>
      {foods.map((f, i) => (
        <View key={i} style={s.listRow}>
          <Text style={s.listEmoji}>{f.emoji}</Text>
          <View style={s.listTextWrap}>
            <Text style={s.listTitle}>{f.name}</Text>
            <Text style={s.listReason}>{f.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function WearView({ colors }: { colors: ColorItem[] }) {
  return (
    <View style={s.listWrap}>
      {colors.map((c, i) => (
        <View key={i} style={s.listRow}>
          <View style={[s.colorSwatch, { backgroundColor: c.hex }]} />
          <View style={s.listTextWrap}>
            <Text style={s.listTitle}>{c.name}</Text>
            <Text style={s.listReason}>{c.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MoveView({ activities, locked }: { activities: ActivityItem[]; locked: boolean }) {
  const { t } = useTranslation('common');
  if (locked) {
    return (
      <View style={s.lockedWrap}>
        <Text style={s.lockedEmoji}>🔒</Text>
        <Text style={s.lockedText}>{t('dailyRoutine.unlockActivities')}</Text>
        <TouchableOpacity style={s.lockedBtn} onPress={() => router.push('/paywall')}>
          <Text style={s.lockedBtnText}>{t('dailyRoutine.upgradeLink')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={s.listWrap}>
      {activities.map((a, i) => (
        <View key={i} style={s.listRow}>
          <Text style={s.listEmoji}>{a.icon}</Text>
          <View style={s.listTextWrap}>
            <View style={s.activityHeader}>
              <Text style={s.listTitle}>{a.title}</Text>
              <Text style={s.activityMeta}>{a.duration} · {a.timing}</Text>
            </View>
            <Text style={s.listReason}>{a.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── ElementRoutineCard ────────────────────────────────────────────────────────

export function ElementRoutineCard({ data, isLoading, isPremium, onShare }: ElementRoutineCardProps) {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<Tab>('nourish');
  const [sharing, setSharing]     = useState(false);
  const shareRef                  = useRef<View>(null);

  // 탭 목록 (번역 적용)
  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'nourish', icon: TAB_ICONS.nourish, label: t('dailyRoutine.tabNourish') },
    { key: 'wear',    icon: TAB_ICONS.wear,    label: t('dailyRoutine.tabWear')    },
    { key: 'move',    icon: TAB_ICONS.move,    label: t('dailyRoutine.tabMove')    },
  ];

  // ── 로딩 스켈레톤 ─────────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <View style={[s.card, { borderColor: T.border.default }]}>
        <View style={[s.accentBar, { backgroundColor: T.bg.elevated }]} />
        <View style={s.body}>
          <SkeletonLine width={120} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLine width="90%" height={12} style={{ marginBottom: 4 }} />
          <SkeletonLine width="70%" height={12} />
        </View>
      </View>
    );
  }

  if (!data) return null;

  const theme       = ELEMENT_THEME[data.dominant_element];
  const elementDay  = t(`dailyRoutine.elementDay.${data.dominant_element}`);

  // ── 공유 ─────────────────────────────────────────────────────────────────
  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      if (shareRef.current) {
        const uri = await captureRef(shareRef, { format: 'png', quality: 1, result: 'tmpfile' });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType:    'image/png',
            dialogTitle: elementDay,
            UTI:         'public.png',
          });
        }
      }
      onShare?.();
    } catch {
      // silently fail
    } finally {
      setSharing(false);
    }
  }

  return (
    <View>
      {/* ── 카드 ── */}
      <View style={[s.card, { borderColor: theme.accent + '44' }]}>
        {/* 상단 액센트 바 */}
        <View style={[s.accentBar, { backgroundColor: theme.accent }]} />

        <View style={s.body}>
          {/* ── 헤더 ── */}
          <View style={s.header}>
            <View style={[s.elementBadge, { backgroundColor: theme.tint, borderColor: theme.accent + '66' }]}>
              <Text style={s.elementEmoji}>{theme.emoji}</Text>
              <Text style={[s.elementLabel, { color: theme.accent }]}>
                {elementDay}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShare} disabled={sharing} style={s.shareBtn}>
              {sharing
                ? <ActivityIndicator size="small" color={theme.accent} />
                : <Text style={[s.shareBtnText, { color: theme.accent }]}>{t('dailyRoutine.share')} 🌟</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── 명상 텍스트 ── */}
          <Text style={s.meditationText}>"{data.meditation_text}"</Text>

          {/* ── 탭 ── */}
          <View style={s.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  s.tab,
                  activeTab === tab.key && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, activeTab === tab.key && { color: theme.accent }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 탭 콘텐츠 ── */}
          {activeTab === 'nourish' && (
            <NourishView foods={data.foods} locked={!isPremium} />
          )}
          {activeTab === 'wear' && (
            <WearView colors={data.colors} />
          )}
          {activeTab === 'move' && (
            <MoveView activities={data.activities} locked={!isPremium} />
          )}
        </View>
      </View>

      {/* ── 숨겨진 공유 카드 (ViewShot 대상) ── */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }}>
        <RoutineShareCard ref={shareRef} data={data} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    borderWidth:     1,
    overflow:        'hidden',
  },
  accentBar: {
    height: 4,
    width:  '100%',
  },
  body: {
    padding: T.spacing[4],
    gap:     T.spacing[3],
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  elementBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             T.spacing[1],
    borderRadius:    T.radius.full,
    paddingHorizontal: T.spacing[3],
    paddingVertical: T.spacing[1],
    borderWidth:     1,
  },
  elementEmoji: { fontSize: 14 },
  elementLabel: { fontSize: T.fontSize.sm, fontWeight: '700' },

  shareBtn:     { paddingVertical: T.spacing[1], paddingHorizontal: T.spacing[2] },
  shareBtnText: { fontSize: T.fontSize.sm, fontWeight: '700' },

  // Meditation
  meditationText: {
    color:      T.text.secondary,
    fontSize:   T.fontSize.sm,
    fontStyle:  'italic',
    lineHeight: 20,
  },

  // Tabs
  tabRow: {
    flexDirection:     'row',
    borderBottomWidth: 1,
    borderBottomColor: T.border.default,
    marginBottom:      T.spacing[1],
  },
  tab: {
    flex:              1,
    alignItems:        'center',
    paddingVertical:   T.spacing[2],
    gap:               2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabIcon:  { fontSize: 16 },
  tabLabel: { fontSize: T.fontSize.xs, color: T.text.muted, fontWeight: '600' },

  // List items
  listWrap:  { gap: T.spacing[3] },
  listRow:   { flexDirection: 'row', gap: T.spacing[3], alignItems: 'flex-start' },
  listEmoji: { fontSize: 22, lineHeight: 28 },
  colorSwatch: {
    width: 28, height: 28, borderRadius: T.radius.md,
    marginTop: 2,
  },
  listTextWrap: { flex: 1 },
  listTitle:    { color: T.text.primary, fontSize: T.fontSize.sm, fontWeight: '600', marginBottom: 2 },
  listReason:   { color: T.text.muted,   fontSize: T.fontSize.xs, lineHeight: 16 },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityMeta:   { color: T.text.faint, fontSize: T.fontSize.xs },

  // Locked state
  lockedWrap: {
    alignItems:      'center',
    gap:             T.spacing[2],
    paddingVertical: T.spacing[4],
  },
  lockedEmoji:   { fontSize: 28 },
  lockedText:    { color: T.text.muted, fontSize: T.fontSize.sm, fontWeight: '600' },
  lockedBtn:     {
    backgroundColor:  T.primary.DEFAULT,
    borderRadius:     T.radius.md,
    paddingHorizontal: T.spacing[4],
    paddingVertical:  T.spacing[2],
  },
  lockedBtnText: { color: T.text.primary, fontSize: T.fontSize.sm, fontWeight: '700' },
});
