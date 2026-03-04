/**
 * My Saju Chart Screen — issue #9 / design-system #31
 *
 * Displays the full 사주팔자 analysis:
 *  - 8-character (4-pillar) grid with element colours & 십신 badges
 *  - 오행 balance bar chart (graduated)
 *  - 십신 (Ten Gods) table
 *  - 대운 (Major Luck Cycle) horizontal timeline — current period highlighted
 */
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSajuStore } from '../../src/store/sajuStore';
import { getShiShin, STEM_ELEMENT, BRANCH_ELEMENT } from '@k-saju/saju-engine';
import { ContentRecommendationSection } from '../../src/components/ContentRecommendationSection';
import { T } from '../../src/theme/tokens';
import type {
  FiveElement,
  Stem,
  Branch,
  ShiShin,
} from '@k-saju/saju-engine';

// ── Element colours & labels ───────────────────────────────────────────────────

const ELEM_COLOR: Record<FiveElement, string> = T.element;

// Maps FiveElement kanji → common:elements key
const ELEM_KEY: Record<FiveElement, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

// ── Pillar row data ───────────────────────────────────────────────────────────

interface PillarInfo {
  key: string;
  label: string;
  stem: Stem;
  branch: Branch;
  shiShin: ShiShin | null;
  isDay: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChartScreen() {
  const { t } = useTranslation(['chart', 'common']);
  const { chart, daewoon, frame, birthData } = useSajuStore();

  if (!chart) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>命</Text>
        <Text style={styles.emptyText}>{t('chart:noChart')}</Text>
      </View>
    );
  }

  const { pillars, elements, dayStem } = chart;
  const dayStemEl = STEM_ELEMENT[dayStem];
  const dayStemColor = ELEM_COLOR[dayStemEl];

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
      label: t('chart:pillars.year'),
      stem: pillars.year.stem,
      branch: pillars.year.branch,
      shiShin: getShiShin(dayStem, pillars.year.stem),
      isDay: false,
    },
    {
      key: 'month',
      label: t('chart:pillars.month'),
      stem: pillars.month.stem,
      branch: pillars.month.branch,
      shiShin: getShiShin(dayStem, pillars.month.stem),
      isDay: false,
    },
    {
      key: 'day',
      label: t('chart:pillars.day'),
      stem: pillars.day.stem,
      branch: pillars.day.branch,
      shiShin: null,
      isDay: true,
    },
  ];

  if (pillars.hour) {
    pillarList.push({
      key: 'hour',
      label: t('chart:pillars.hour'),
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
  const maxScore = Math.max(...elementRows.map((r) => r.score), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <Text style={styles.title}>{t('chart:cosmicBlueprint')}</Text>
      <Text style={styles.subtitle}>{t('chart:destinyMap')}</Text>

      {/* ── Day Master pill ── */}
      <View style={styles.dayMasterRow}>
        <Text style={styles.dayMasterLabel}>{t('chart:dayMaster')}</Text>
        <View style={[
          styles.dayMasterPill,
          { backgroundColor: dayStemColor + '22', borderColor: dayStemColor },
        ]}>
          <Text style={[styles.dayMasterChar, { color: dayStemColor }]}>{dayStem}</Text>
          <Text style={[styles.dayMasterElem, { color: dayStemColor }]}>
            {' '}{t(`common:elements.${ELEM_KEY[dayStemEl]}`)}
          </Text>
        </View>
      </View>

      {/* ── 8-Character Pillar Grid ── */}
      <View style={styles.pillarsCard}>
        {/* Decorative background glyph */}
        <Text style={styles.pillarsCardDeco}>八</Text>

        {/* Column connector line */}
        <View style={styles.connectorLine} />

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
                    ? { backgroundColor: T.semantic.gold + '22', borderColor: T.semantic.gold }
                    : { backgroundColor: T.bg.base, borderColor: T.border.default },
                ]}>
                  <Text style={[styles.shiShinText, p.isDay && { color: T.semantic.gold }]}>
                    {p.isDay ? t('chart:dayMaster') : (p.shiShin ?? '')}
                  </Text>
                </View>

                {/* Heavenly Stem */}
                <View style={[
                  styles.stemBox,
                  { backgroundColor: sc + '22', borderColor: sc },
                  p.isDay && { borderWidth: 2.5, borderColor: T.semantic.gold, backgroundColor: T.semantic.gold + '15' },
                ]}>
                  <Text style={[styles.stemChar, { color: p.isDay ? T.semantic.gold : sc }]}>
                    {p.stem}
                  </Text>
                </View>

                {/* Vertical connector dot */}
                <View style={[styles.connectorDot, { backgroundColor: sc + '44' }]} />

                {/* Earthly Branch */}
                <View style={[
                  styles.branchBox,
                  { backgroundColor: bc + '15', borderColor: bc + '66' },
                ]}>
                  <Text style={[styles.branchChar, { color: bc }]}>{p.branch}</Text>
                </View>

                <Text style={[styles.branchElem, { color: bc + 'aa' }]}>
                  {t(`common:elements.${ELEM_KEY[branchEl]}`)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Element Balance ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('chart:elementBalance')}</Text>
        <Text style={styles.sectionDeco}>五行</Text>
      </View>
      <View style={styles.elementSection}>
        {elementRows.map((r) => {
          const pct = r.score / maxScore;
          return (
            <View key={r.key} style={styles.elementRow}>
              <View style={styles.elementLabelCol}>
                <Text style={[styles.elementKanji, { color: ELEM_COLOR[r.key] }]}>{r.key}</Text>
                <Text style={[styles.elementName, { color: ELEM_COLOR[r.key] }]}>
                  {t(`common:elements.${ELEM_KEY[r.key]}`)}
                </Text>
              </View>
              <View style={styles.barBg}>
                {/* Segmented bar */}
                <View style={[
                  styles.barFill,
                  {
                    flex: Math.max(r.score, 0),
                    backgroundColor: ELEM_COLOR[r.key],
                    opacity: 0.85 + pct * 0.15,
                  },
                ]} />
                <View style={{ flex: Math.max(totalScore - r.score, 0) }} />
              </View>
              <Text style={[styles.elementScore, { color: ELEM_COLOR[r.key] }]}>{r.score}</Text>
            </View>
          );
        })}
      </View>

      {/* ── 십신 Table ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('chart:shishin.title')}</Text>
        <Text style={styles.sectionDeco}>十神</Text>
      </View>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.cellHeader]}>柱</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('chart:stem')}</Text>
          <Text style={[styles.cell, styles.cellHeader, styles.cellWide]}>
            {t('chart:shishin.title')}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('chart:branch')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>五行</Text>
        </View>
        {pillarList.map((p) => {
          const stemEl = STEM_ELEMENT[p.stem];
          const branchEl = BRANCH_ELEMENT[p.branch];
          return (
            <View key={p.key} style={[styles.tableRow, p.isDay && styles.tableRowDay]}>
              <Text style={[styles.cell, styles.cellText, p.isDay && { color: T.semantic.gold }]}>
                {p.label}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[stemEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.stem}
              </Text>
              <Text style={[styles.cell, styles.cellWide, styles.cellText, p.isDay && { color: T.semantic.gold, fontWeight: '700' }]}>
                {p.isDay ? t('chart:dayMaster') : (p.shiShin ?? '')}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.branch}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: T.fontSize.xs, textAlign: 'center' }]}>
                {t(`common:elements.${ELEM_KEY[branchEl]}`)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── 대운 Timeline ── */}
      {daewoon.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('chart:daewoon')}</Text>
            <Text style={styles.sectionDeco}>大運</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daewoonScroll}
          >
            {daewoon.map((dw, i) => {
              const isCurrent = i === currentDwIdx;
              const dwStemEl = STEM_ELEMENT[dw.pillar.stem];
              const dwBranchEl = BRANCH_ELEMENT[dw.pillar.branch];
              const dwColor = ELEM_COLOR[dw.element];
              return (
                <View
                  key={i}
                  style={[
                    styles.daewoonCard,
                    { borderColor: isCurrent ? T.semantic.gold : T.border.default },
                    isCurrent && { backgroundColor: T.semantic.gold + '0d' },
                  ]}
                >
                  {/* Element accent top bar */}
                  <View style={[styles.dwAccentBar, { backgroundColor: dwColor }]} />

                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>{t('chart:now')}</Text>
                    </View>
                  )}
                  <Text style={[styles.dwAge, isCurrent && { color: T.semantic.gold }]}>
                    {dw.startAge}–{dw.startAge + 9}
                  </Text>
                  <Text style={[styles.dwAgeSuffix, isCurrent && { color: T.semantic.gold + '88' }]}>
                    {t('chart:ageSuffix')}
                  </Text>
                  <Text style={[styles.dwStem, { color: ELEM_COLOR[dwStemEl] }]}>
                    {dw.pillar.stem}
                  </Text>
                  <Text style={[styles.dwBranch, { color: ELEM_COLOR[dwBranchEl] }]}>
                    {dw.pillar.branch}
                  </Text>
                  <View style={[styles.dwDot, { backgroundColor: dwColor }]} />
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
  container: { flex: 1, backgroundColor: T.bg.base },
  content: { padding: T.spacing[5], paddingTop: 60 },

  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: T.bg.base,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.spacing[8],
  },
  emptyIcon: { fontSize: 80, opacity: 0.15, marginBottom: T.spacing[4] },
  emptyText: { color: T.text.faint, fontSize: T.fontSize.md, textAlign: 'center', lineHeight: 24 },

  // Header
  title: { fontSize: T.fontSize['4xl'], fontWeight: '800', color: T.text.primary, marginBottom: 2, letterSpacing: -0.5 },
  subtitle: { fontSize: T.fontSize.sm, color: T.text.faint, marginBottom: T.spacing[4] },

  // Day Master pill
  dayMasterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: T.spacing[6] },
  dayMasterLabel: { color: T.text.faint, fontSize: T.fontSize.sm, marginRight: T.spacing[3], fontWeight: '600' },
  dayMasterPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: T.radius.md, borderWidth: 1.5,
    paddingHorizontal: T.spacing[4], paddingVertical: T.spacing[2],
  },
  dayMasterChar: { fontSize: 22, fontWeight: '800' },
  dayMasterElem: { fontSize: T.fontSize.base, fontWeight: '600' },

  // Pillar grid card
  pillarsCard: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    padding: T.spacing[5],
    marginBottom: T.spacing[8],
    borderWidth: 1,
    borderColor: T.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  pillarsCardDeco: {
    position: 'absolute',
    fontSize: 120,
    fontWeight: '900',
    color: T.primary.DEFAULT,
    opacity: 0.05,
    right: -10,
    top: -10,
  },
  connectorLine: {
    position: 'absolute',
    top: '52%',
    left: T.spacing[5],
    right: T.spacing[5],
    height: 1,
    backgroundColor: T.border.subtle,
  },
  pillarsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillar: { alignItems: 'center', flex: 1 },
  pillarLabel: {
    fontSize: T.fontSize.xs,
    color: T.text.faint,
    textAlign: 'center',
    marginBottom: T.spacing[2],
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // 십신 badge
  shiShinBadge: {
    borderRadius: T.radius.sm, borderWidth: 1,
    paddingHorizontal: 4, paddingVertical: 2,
    marginBottom: T.spacing[2], minWidth: 44, alignItems: 'center',
  },
  shiShinText: {
    fontSize: 9, color: T.primary.lighter, fontWeight: '700', textAlign: 'center',
  },

  // Stem & Branch boxes
  stemBox: {
    width: 54, height: 54,
    borderRadius: T.radius.md, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  stemChar: { fontSize: 28, fontWeight: '800' },
  connectorDot: { width: 5, height: 5, borderRadius: 3, marginVertical: 2 },
  branchBox: {
    width: 54, height: 54,
    borderRadius: T.radius.md, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  branchChar: { fontSize: 26, fontWeight: '700' },
  branchElem: { fontSize: 9, fontWeight: '600' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing[4] },
  sectionTitle: { fontSize: T.fontSize.md, fontWeight: '700', color: T.text.primary },
  sectionDeco: { color: T.primary.DEFAULT, fontSize: T.fontSize.base, fontWeight: '800', opacity: 0.5 },

  // Element balance
  elementSection: { marginBottom: T.spacing[8] },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: T.spacing[3] },
  elementLabelCol: { width: 52, alignItems: 'flex-start' },
  elementKanji: { fontSize: T.fontSize.md, fontWeight: '800', lineHeight: 20 },
  elementName: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: T.bg.input,
    borderRadius: T.radius.sm,
    marginHorizontal: T.spacing[3],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: { height: 10, borderRadius: T.radius.sm },
  elementScore: {
    fontSize: T.fontSize.sm, fontWeight: '700',
    width: 20, textAlign: 'right',
  },

  // 십신 table
  table: {
    marginBottom: T.spacing[8],
    borderRadius: T.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border.default,
  },
  tableHeader: { backgroundColor: T.bg.input },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: T.bg.input,
    paddingVertical: T.spacing[3], paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowDay: { backgroundColor: T.semantic.gold + '08' },
  cell: { flex: 1, textAlign: 'center' },
  cellWide: { flex: 1.4 },
  cellHeader: { fontSize: T.fontSize.xs, fontWeight: '700', color: T.text.disabled },
  cellText: { fontSize: T.fontSize.sm, color: T.primary.lighter, textAlign: 'center' },

  // 대운 timeline
  daewoonScroll: { paddingBottom: T.spacing[2], paddingRight: T.spacing[5], marginBottom: T.spacing[8] },
  daewoonCard: {
    width: 80,
    minHeight: 136,
    borderRadius: T.radius.lg,
    borderWidth: 1.5,
    paddingBottom: T.spacing[3],
    marginRight: T.spacing[3],
    alignItems: 'center',
    backgroundColor: T.bg.card,
    overflow: 'hidden',
  },
  dwAccentBar: { width: '100%', height: 3, marginBottom: T.spacing[2] },
  nowBadge: {
    backgroundColor: T.semantic.gold,
    borderRadius: T.radius.sm,
    paddingHorizontal: 5, paddingVertical: 2,
    marginBottom: 4,
  },
  nowBadgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  dwAge: { fontSize: T.fontSize.sm, fontWeight: '700', color: T.text.faint, textAlign: 'center' },
  dwAgeSuffix: { fontSize: 9, color: T.text.disabled, marginBottom: T.spacing[2], textAlign: 'center' },
  dwStem: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  dwBranch: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  dwDot: { width: 7, height: 7, borderRadius: 4, marginTop: T.spacing[2] },
});
