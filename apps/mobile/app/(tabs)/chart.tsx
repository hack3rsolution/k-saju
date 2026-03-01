/**
 * My Saju Chart Screen — issue #9
 *
 * Displays the full 사주팔자 analysis:
 *  - 8-character (4-pillar) grid with element colours & 십신 badges
 *  - 오행 balance bar chart
 *  - 십신 (Ten Gods) table
 *  - 대운 (Major Luck Cycle) horizontal timeline — current period highlighted
 *
 * All labels are localised per the user's cultural frame (6 variants).
 */
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSajuStore } from '../../src/store/sajuStore';
import { getShiShin, STEM_ELEMENT, BRANCH_ELEMENT } from '@k-saju/saju-engine';
import { ContentRecommendationSection } from '../../src/components/ContentRecommendationSection';
import type {
  CulturalFrame,
  FiveElement,
  Stem,
  Branch,
  ShiShin,
} from '@k-saju/saju-engine';

// ── Element colours & labels ───────────────────────────────────────────────────

const ELEM_COLOR: Record<FiveElement, string> = {
  木: '#22c55e',
  火: '#ef4444',
  土: '#eab308',
  金: '#94a3b8',
  水: '#3b82f6',
};

const ELEM_EN: Record<FiveElement, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

// ── Cultural frame label sets ─────────────────────────────────────────────────

interface FrameLabels {
  title: string;
  subtitle: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  tenGods: string;
  luckCycle: string;
  elementBalance: string;
  ageSuffix: string;
  stemLabel: string;
  branchLabel: string;
  noChart: string;
}

const FRAME_LABELS: Record<CulturalFrame, FrameLabels> = {
  kr: {
    title: '사주팔자',
    subtitle: '나의 운명의 지도',
    yearPillar: '연주',
    monthPillar: '월주',
    dayPillar: '일주',
    hourPillar: '시주',
    dayMaster: '일간',
    tenGods: '십신 (十神)',
    luckCycle: '대운 (大運)',
    elementBalance: '오행 균형',
    ageSuffix: '세',
    stemLabel: '천간',
    branchLabel: '지지',
    noChart: '온보딩을 완료하면 사주팔자를 볼 수 있습니다.',
  },
  cn: {
    title: '四柱八字 · BaZi',
    subtitle: '命運地圖',
    yearPillar: '年柱',
    monthPillar: '月柱',
    dayPillar: '日柱',
    hourPillar: '時柱',
    dayMaster: '日主',
    tenGods: '十神',
    luckCycle: '大運',
    elementBalance: '五行平衡',
    ageSuffix: '歲',
    stemLabel: '天干',
    branchLabel: '地支',
    noChart: 'Complete onboarding to view your BaZi chart.',
  },
  jp: {
    title: '四柱推命',
    subtitle: '命の地図',
    yearPillar: '年柱',
    monthPillar: '月柱',
    dayPillar: '日柱',
    hourPillar: '時柱',
    dayMaster: '日干',
    tenGods: '十神',
    luckCycle: '大運',
    elementBalance: '五行バランス',
    ageSuffix: '歳',
    stemLabel: '天干',
    branchLabel: '地支',
    noChart: 'オンボーディングを完了してチャートを表示してください。',
  },
  en: {
    title: 'Cosmic Blueprint',
    subtitle: 'Your Destiny Map',
    yearPillar: 'Year',
    monthPillar: 'Month',
    dayPillar: 'Day',
    hourPillar: 'Hour',
    dayMaster: 'Day Master',
    tenGods: 'Ten Gods',
    luckCycle: 'Major Luck Cycle',
    elementBalance: 'Element Balance',
    ageSuffix: 'yrs',
    stemLabel: 'Stem',
    branchLabel: 'Branch',
    noChart: 'Complete onboarding to view your Cosmic Blueprint.',
  },
  es: {
    title: 'Destino Cósmico',
    subtitle: 'Tu Mapa del Destino',
    yearPillar: 'Año',
    monthPillar: 'Mes',
    dayPillar: 'Día',
    hourPillar: 'Hora',
    dayMaster: 'Maestro del Día',
    tenGods: 'Diez Dioses',
    luckCycle: 'Ciclo de Suerte Mayor',
    elementBalance: 'Balance Elemental',
    ageSuffix: 'años',
    stemLabel: 'Tallo',
    branchLabel: 'Rama',
    noChart: 'Completa el onboarding para ver tu carta.',
  },
  in: {
    title: 'Vedic Fusion',
    subtitle: 'Your Cosmic Map',
    yearPillar: 'Year',
    monthPillar: 'Month',
    dayPillar: 'Day',
    hourPillar: 'Hour',
    dayMaster: 'Day Master',
    tenGods: 'Ten Deities',
    luckCycle: 'Mahadasha Cycle',
    elementBalance: 'Panchabhoota Balance',
    ageSuffix: 'yrs',
    stemLabel: 'Stem',
    branchLabel: 'Branch',
    noChart: 'Complete onboarding to view your Vedic chart.',
  },
};

// ── Pillar row data ───────────────────────────────────────────────────────────

interface PillarInfo {
  key: string;
  label: string;
  stem: Stem;
  branch: Branch;
  shiShin: ShiShin | null; // null = day pillar (self)
  isDay: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChartScreen() {
  const { chart, daewoon, frame, birthData } = useSajuStore();
  const labels = FRAME_LABELS[frame ?? 'en'];

  if (!chart) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>命</Text>
        <Text style={styles.emptyText}>{labels.noChart}</Text>
      </View>
    );
  }

  const { pillars, elements, dayStem } = chart;
  const dayStemEl = STEM_ELEMENT[dayStem];

  // ── Current 대운 index ────────────────────────────────────────────────────
  const currentAge = birthData ? new Date().getFullYear() - birthData.year : -1;
  let currentDwIdx = -1;
  for (let i = daewoon.length - 1; i >= 0; i--) {
    if (daewoon[i].startAge <= currentAge) { currentDwIdx = i; break; }
  }

  // ── Build pillar list ─────────────────────────────────────────────────────
  const pillarList: PillarInfo[] = [
    {
      key: 'year',
      label: labels.yearPillar,
      stem: pillars.year.stem,
      branch: pillars.year.branch,
      shiShin: getShiShin(dayStem, pillars.year.stem),
      isDay: false,
    },
    {
      key: 'month',
      label: labels.monthPillar,
      stem: pillars.month.stem,
      branch: pillars.month.branch,
      shiShin: getShiShin(dayStem, pillars.month.stem),
      isDay: false,
    },
    {
      key: 'day',
      label: labels.dayPillar,
      stem: pillars.day.stem,
      branch: pillars.day.branch,
      shiShin: null,
      isDay: true,
    },
  ];

  if (pillars.hour) {
    pillarList.push({
      key: 'hour',
      label: labels.hourPillar,
      stem: pillars.hour.stem,
      branch: pillars.hour.branch,
      shiShin: getShiShin(dayStem, pillars.hour.stem),
      isDay: false,
    });
  }

  // ── Element balance rows ──────────────────────────────────────────────────
  const elementRows: { key: FiveElement; score: number }[] = [
    { key: '木', score: elements.Wood },
    { key: '火', score: elements.Fire },
    { key: '土', score: elements.Earth },
    { key: '金', score: elements.Metal },
    { key: '水', score: elements.Water },
  ];
  const totalScore = elementRows.reduce((s, r) => s + r.score, 0) || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <Text style={styles.title}>{labels.title}</Text>
      <Text style={styles.subtitle}>{labels.subtitle}</Text>

      {/* ── Day Master pill ── */}
      <View style={styles.dayMasterRow}>
        <Text style={styles.dayMasterLabel}>{labels.dayMaster}</Text>
        <View style={[
          styles.dayMasterPill,
          { backgroundColor: ELEM_COLOR[dayStemEl] + '22', borderColor: ELEM_COLOR[dayStemEl] },
        ]}>
          <Text style={[styles.dayMasterChar, { color: ELEM_COLOR[dayStemEl] }]}>{dayStem}</Text>
          <Text style={[styles.dayMasterElem, { color: ELEM_COLOR[dayStemEl] }]}>
            {' '}{ELEM_EN[dayStemEl]}
          </Text>
        </View>
      </View>

      {/* ── 8-Character Pillar Grid ── */}
      <View style={styles.pillarsRow}>
        {pillarList.map((p) => {
          const stemEl = STEM_ELEMENT[p.stem];
          const branchEl = BRANCH_ELEMENT[p.branch];
          const sc = ELEM_COLOR[stemEl];
          const bc = ELEM_COLOR[branchEl];
          return (
            <View key={p.key} style={styles.pillar}>
              <Text style={styles.pillarLabel}>{p.label}</Text>

              {/* 십신 badge */}
              <View style={[
                styles.shiShinBadge,
                p.isDay
                  ? { backgroundColor: '#ffd70022', borderColor: '#ffd700' }
                  : { backgroundColor: '#ffffff0a', borderColor: '#ffffff22' },
              ]}>
                <Text style={[styles.shiShinText, p.isDay && { color: '#ffd700' }]}>
                  {p.isDay ? labels.dayMaster : (p.shiShin ?? '')}
                </Text>
              </View>

              {/* Heavenly Stem */}
              <View style={[
                styles.stemBox,
                { backgroundColor: sc + '22', borderColor: sc },
                p.isDay && { borderWidth: 2.5, borderColor: '#ffd700' },
              ]}>
                <Text style={[styles.stemChar, { color: p.isDay ? '#ffd700' : sc }]}>
                  {p.stem}
                </Text>
              </View>

              {/* Earthly Branch */}
              <View style={[
                styles.branchBox,
                { backgroundColor: bc + '15', borderColor: bc + '66' },
              ]}>
                <Text style={[styles.branchChar, { color: bc }]}>{p.branch}</Text>
              </View>

              <Text style={[styles.branchElem, { color: bc + 'aa' }]}>{branchEl}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Element Balance ── */}
      <Text style={styles.sectionTitle}>{labels.elementBalance}</Text>
      <View style={styles.elementSection}>
        {elementRows.map((r) => (
          <View key={r.key} style={styles.elementRow}>
            <Text style={[styles.elementLabel, { color: ELEM_COLOR[r.key] }]}>
              {ELEM_EN[r.key]} · {r.key}
            </Text>
            {/* Flex-ratio bar — avoids percentage string type issues */}
            <View style={styles.barBg}>
              <View style={[styles.barFill, { flex: Math.max(r.score, 0), backgroundColor: ELEM_COLOR[r.key] }]} />
              <View style={{ flex: Math.max(totalScore - r.score, 0) }} />
            </View>
            <Text style={styles.elementScore}>{r.score}</Text>
          </View>
        ))}
      </View>

      {/* ── 십신 Table ── */}
      <Text style={styles.sectionTitle}>{labels.tenGods}</Text>
      <View style={styles.table}>
        {/* Header row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.cellHeader]}>柱</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{labels.stemLabel}</Text>
          <Text style={[styles.cell, styles.cellHeader, styles.cellWide]}>
            {labels.tenGods.split(' ')[0]}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>{labels.branchLabel}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>오행</Text>
        </View>

        {pillarList.map((p) => {
          const stemEl = STEM_ELEMENT[p.stem];
          const branchEl = BRANCH_ELEMENT[p.branch];
          return (
            <View key={p.key} style={[styles.tableRow, p.isDay && styles.tableRowDay]}>
              <Text style={[styles.cell, styles.cellText, p.isDay && { color: '#ffd700' }]}>
                {p.label}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[stemEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.stem}
              </Text>
              <Text style={[styles.cell, styles.cellWide, styles.cellText, p.isDay && { color: '#ffd700', fontWeight: '700' }]}>
                {p.isDay ? labels.dayMaster : (p.shiShin ?? '')}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.branch}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: 11, textAlign: 'center' }]}>
                {ELEM_EN[branchEl]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── 대운 Timeline ── */}
      {daewoon.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{labels.luckCycle}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daewoonScroll}
          >
            {daewoon.map((dw, i) => {
              const isCurrent = i === currentDwIdx;
              const dwStemEl = STEM_ELEMENT[dw.pillar.stem];
              const dwBranchEl = BRANCH_ELEMENT[dw.pillar.branch];
              return (
                <View
                  key={i}
                  style={[
                    styles.daewoonCard,
                    { borderColor: isCurrent ? '#ffd700' : '#2d1854' },
                    isCurrent && { backgroundColor: '#1e1040' },
                  ]}
                >
                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                  <Text style={[styles.dwAge, isCurrent && { color: '#ffd700' }]}>
                    {dw.startAge}–{dw.startAge + 9}
                  </Text>
                  <Text style={[styles.dwAgeSuffix, isCurrent && { color: '#ffd70088' }]}>
                    {labels.ageSuffix}
                  </Text>
                  <Text style={[styles.dwStem, { color: ELEM_COLOR[dwStemEl] }]}>
                    {dw.pillar.stem}
                  </Text>
                  <Text style={[styles.dwBranch, { color: ELEM_COLOR[dwBranchEl] }]}>
                    {dw.pillar.branch}
                  </Text>
                  <View style={[styles.dwDot, { backgroundColor: ELEM_COLOR[dw.element] }]} />
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── Content Recommendation ── */}
      <ContentRecommendationSection frame={frame ?? 'en'} />

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Container
  container: { flex: 1, backgroundColor: '#0d0016' },
  content: { padding: 20, paddingTop: 60 },

  // ── Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0d0016',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 80, opacity: 0.15, marginBottom: 16 },
  emptyText: { color: '#9d8fbe', fontSize: 15, textAlign: 'center', lineHeight: 24 },

  // ── Header
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#9d8fbe', marginBottom: 16 },

  // ── Day Master pill
  dayMasterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dayMasterLabel: { color: '#9d8fbe', fontSize: 13, marginRight: 12, fontWeight: '600' },
  dayMasterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dayMasterChar: { fontSize: 22, fontWeight: '800' },
  dayMasterElem: { fontSize: 14, fontWeight: '600' },

  // ── Pillar grid
  pillarsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  pillar: { alignItems: 'center', flex: 1 },
  pillarLabel: {
    fontSize: 10,
    color: '#9d8fbe',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // 십신 badge
  shiShinBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  shiShinText: {
    fontSize: 9,
    color: '#c4b5fd',
    fontWeight: '700',
    textAlign: 'center',
  },

  // Stem & Branch boxes
  stemBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stemChar: { fontSize: 28, fontWeight: '800' },

  branchBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchChar: { fontSize: 26, fontWeight: '700' },
  branchElem: { fontSize: 9, fontWeight: '600' },

  // ── Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },

  // ── Element balance
  elementSection: { marginBottom: 32 },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  elementLabel: { width: 82, fontSize: 12, fontWeight: '700' },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e0a38',
    borderRadius: 4,
    marginHorizontal: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: { height: 8 },
  elementScore: {
    color: '#9d8fbe',
    fontSize: 13,
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
  },

  // ── 십신 table
  table: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d1854',
  },
  tableHeader: { backgroundColor: '#1a0a38' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e0a38',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowDay: { backgroundColor: '#ffd70008' },
  cell: { flex: 1, textAlign: 'center' },
  cellWide: { flex: 1.4 },
  cellHeader: { fontSize: 10, fontWeight: '700', color: '#6b5b8f' },
  cellText: { fontSize: 12, color: '#c4b5fd', textAlign: 'center' },

  // ── 대운 timeline
  daewoonScroll: { paddingBottom: 8, paddingRight: 20 },
  daewoonCard: {
    width: 80,
    minHeight: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#130820',
  },
  nowBadge: {
    backgroundColor: '#ffd700',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 4,
  },
  nowBadgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  dwAge: { fontSize: 12, fontWeight: '700', color: '#9d8fbe', textAlign: 'center' },
  dwAgeSuffix: { fontSize: 9, color: '#6b5b8f', marginBottom: 6, textAlign: 'center' },
  dwStem: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  dwBranch: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  dwDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
});
