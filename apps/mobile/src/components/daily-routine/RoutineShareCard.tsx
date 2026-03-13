/**
 * RoutineShareCard — SNS 공유용 오행 루틴 카드
 *
 * react-native-view-shot captureRef 대상.
 * 320pt fixed width. 오행 테마별 배경색 (밝은 톤, SNS 최적화).
 * forwardRef<View> 패턴 (기존 ShareCard.tsx 동일).
 */
import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DailyRoutineData, RoutineElement, ColorItem } from '../../hooks/useDailyRoutine';

// ── Element theme (라이트 톤 — 공유 이미지 전용) ──────────────────────────────

const ELEMENT_THEME: Record<RoutineElement, {
  bg:      string;
  accent:  string;
  textDark: string;
  emoji:   string;
  label:   string;
  labelKo: string;
}> = {
  Wood:  { bg: '#F0FDF4', accent: '#16A34A', textDark: '#14532D', emoji: '🌱', label: 'WOOD DAY',  labelKo: '木' },
  Fire:  { bg: '#FFF1F2', accent: '#E11D48', textDark: '#881337', emoji: '🔥', label: 'FIRE DAY',  labelKo: '火' },
  Earth: { bg: '#FFFBEB', accent: '#D97706', textDark: '#78350F', emoji: '🌾', label: 'EARTH DAY', labelKo: '土' },
  Metal: { bg: '#F8FAFC', accent: '#64748B', textDark: '#1E293B', emoji: '⚡', label: 'METAL DAY', labelKo: '金' },
  Water: { bg: '#EFF6FF', accent: '#2563EB', textDark: '#1E3A8A', emoji: '💧', label: 'WATER DAY', labelKo: '水' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface RoutineShareCardProps {
  data: DailyRoutineData;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RoutineShareCard = forwardRef<View, RoutineShareCardProps>(
  function RoutineShareCard({ data }, ref) {
    const theme     = ELEMENT_THEME[data.dominant_element];
    const dateStr   = new Date(data.date + 'T00:00:00').toLocaleDateString('en', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    // 색상 스워치 스트라이프 (최대 2개)
    const swatchColors = data.colors.slice(0, 2).map((c: ColorItem) => c.hex);
    // 음식 한 줄 요약
    const foodLine = data.foods.slice(0, 3).map(f => `${f.emoji} ${f.name}`).join('  ·  ');
    // 색상 한 줄 요약
    const colorLine = data.colors.slice(0, 2).map(c => c.name).join('  ·  ');

    return (
      <View ref={ref} style={[s.card, { backgroundColor: theme.bg }]}>

        {/* ── 상단 오행 색상 바 ── */}
        <View style={s.topBar}>
          {swatchColors.map((hex, i) => (
            <View key={i} style={[s.topBarSegment, { backgroundColor: hex }]} />
          ))}
          {swatchColors.length < 2 && (
            <View style={[s.topBarSegment, { backgroundColor: theme.accent }]} />
          )}
        </View>

        {/* ── 헤더 ── */}
        <View style={s.header}>
          <Text style={[s.elementLabel, { color: theme.accent }]}>
            {theme.emoji}  {theme.labelKo} {theme.label}
          </Text>
          <Text style={[s.dateText, { color: theme.accent + 'aa' }]}>{dateStr}</Text>
        </View>

        {/* ── 명상 텍스트 ── */}
        <View style={[s.meditationWrap, { borderLeftColor: theme.accent }]}>
          <Text style={[s.meditationText, { color: theme.textDark }]}>
            "{data.meditation_text}"
          </Text>
        </View>

        {/* ── 구분선 ── */}
        <View style={s.dividerRow}>
          {swatchColors.map((hex, i) => (
            <View key={i} style={[s.dividerDot, { backgroundColor: hex }]} />
          ))}
          <View style={[s.dividerLine, { backgroundColor: theme.accent + '44' }]} />
        </View>

        {/* ── 요약 그리드 ── */}
        <View style={s.summaryGrid}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryLabel, { color: theme.accent }]}>🍽 EAT</Text>
            <Text style={[s.summaryValue, { color: theme.textDark }]}>{foodLine}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryLabel, { color: theme.accent }]}>🎨 WEAR</Text>
            <Text style={[s.summaryValue, { color: theme.textDark }]}>{colorLine}</Text>
          </View>
          {data.activities[0] && (
            <View style={s.summaryItem}>
              <Text style={[s.summaryLabel, { color: theme.accent }]}>🏃 MOVE</Text>
              <Text style={[s.summaryValue, { color: theme.textDark }]}>
                {data.activities[0].icon} {data.activities[0].title}
              </Text>
            </View>
          )}
        </View>

        {/* ── 푸터 ── */}
        <View style={[s.footer, { borderTopColor: theme.accent + '33' }]}>
          <Text style={[s.footerApp, { color: theme.textDark }]}>K-Saju Global</Text>
          <Text style={[s.footerTags, { color: theme.accent + 'cc' }]}>
            #FiveElements #{data.dominant_element}Energy #KSaju
          </Text>
        </View>
      </View>
    );
  },
);

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 320;

const s = StyleSheet.create({
  card: {
    width:        CARD_WIDTH,
    borderRadius: 16,
    overflow:     'hidden',
  },

  // 상단 색상 바
  topBar: {
    flexDirection: 'row',
    height:        6,
  },
  topBarSegment: {
    flex: 1,
  },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     4,
    gap:               4,
  },
  elementLabel: {
    fontSize:    20,
    fontWeight:  '800',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize:   12,
    fontWeight: '500',
  },

  // 명상
  meditationWrap: {
    marginHorizontal: 20,
    marginVertical:   12,
    borderLeftWidth:  3,
    paddingLeft:      12,
  },
  meditationText: {
    fontSize:   14,
    fontStyle:  'italic',
    lineHeight: 22,
    fontWeight: '500',
  },

  // 구분선
  dividerRow: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: 20,
    marginBottom:     12,
    gap:              6,
  },
  dividerDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },

  // 요약
  summaryGrid: {
    marginHorizontal: 20,
    gap:              8,
    marginBottom:     12,
  },
  summaryItem: { gap: 2 },
  summaryLabel: {
    fontSize:    9,
    fontWeight:  '800',
    letterSpacing: 1.5,
  },
  summaryValue: {
    fontSize:   12,
    fontWeight: '500',
  },

  // 푸터
  footer: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginHorizontal: 20,
    paddingVertical:  12,
    borderTopWidth:   1,
  },
  footerApp:  { fontSize: 11, fontWeight: '800' },
  footerTags: { fontSize: 9,  fontWeight: '600' },
});
