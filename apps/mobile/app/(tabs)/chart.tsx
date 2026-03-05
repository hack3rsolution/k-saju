/**
 * My Saju Chart Screen — issue #9 / design-system #31
 *
 * Displays the full 사주팔자 analysis:
 *  - 8-character (4-pillar) grid with element colours & 십신 badges
 *  - 오행 balance bar chart (graduated)
 *  - 십신 (Ten Gods) table
 *  - 대운 (Major Luck Cycle) horizontal timeline — current period highlighted
 */
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSajuStore } from '../../src/store/sajuStore';
import { getShiShin, STEM_ELEMENT, BRANCH_ELEMENT } from '@k-saju/saju-engine';
import { ContentRecommendationSection } from '../../src/components/ContentRecommendationSection';
import { PillarDetailModal } from '../../src/components/PillarDetailModal';
import { T } from '../../src/theme/tokens';
import type {
  FiveElement,
  Stem,
  Branch,
  ShiShin,
  DaewoonPeriod,
} from '@k-saju/saju-engine';

// ── Element colours & labels ───────────────────────────────────────────────────

const ELEM_COLOR: Record<FiveElement, string> = T.element;

// Maps FiveElement kanji → common:elements key
const ELEM_KEY: Record<FiveElement, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

// ── 오행 설명 데이터 ──────────────────────────────────────────────────────────

const ELEMENT_INFO: Record<FiveElement, { symbol: string; season: string; desc: string; strong: string; weak: string }> = {
  木: {
    symbol: '🌳', season: '봄',
    desc: '목(木)은 봄의 기운으로, 성장·창조·시작을 상징합니다. 위로 뻗으려는 진취적인 에너지입니다.',
    strong: '목 기운이 강하면 추진력·창의성·리더십이 뛰어나지만, 고집이 세고 타인과 충돌하기 쉽습니다.',
    weak: '목 기운이 부족하면 유연성과 계획력이 약해지고, 새로운 시작이 두려울 수 있습니다.',
  },
  火: {
    symbol: '🔥', season: '여름',
    desc: '화(火)는 여름의 기운으로, 열정·표현·소통을 상징합니다. 빛처럼 주변을 밝히는 에너지입니다.',
    strong: '화 기운이 강하면 카리스마와 열정이 넘치지만, 성급하고 감정 기복이 심할 수 있습니다.',
    weak: '화 기운이 부족하면 표현력과 사교성이 다소 약해질 수 있습니다.',
  },
  土: {
    symbol: '⛰️', season: '환절기',
    desc: '토(土)는 환절기의 기운으로, 안정·신뢰·중심을 상징합니다. 모든 오행을 품는 대지의 에너지입니다.',
    strong: '토 기운이 강하면 신뢰감과 포용력이 있지만, 변화에 보수적이고 답답해 보일 수 있습니다.',
    weak: '토 기운이 부족하면 중심 잡기 어렵고 감정적으로 불안정할 수 있습니다.',
  },
  金: {
    symbol: '⚔️', season: '가을',
    desc: '금(金)은 가을의 기운으로, 결단·수확·정의를 상징합니다. 불필요한 것을 잘라내는 에너지입니다.',
    strong: '금 기운이 강하면 결단력과 정확성이 뛰어나지만, 날카롭고 냉정해 보일 수 있습니다.',
    weak: '금 기운이 부족하면 결단력과 실행력이 약하고, 마무리가 흐지부지될 수 있습니다.',
  },
  水: {
    symbol: '🌊', season: '겨울',
    desc: '수(水)는 겨울의 기운으로, 지혜·감수성·포용을 상징합니다. 낮은 곳으로 흐르며 모든 것을 담는 에너지입니다.',
    strong: '수 기운이 강하면 지혜와 유연성이 뛰어나지만, 방향 없이 흘러 목표를 잃을 수 있습니다.',
    weak: '수 기운이 부족하면 직관력과 감수성이 약해지고, 고집이 세질 수 있습니다.',
  },
};

// ── 십신 설명 데이터 ──────────────────────────────────────────────────────────

const SHISHIN_INFO: Record<ShiShin, { category: string; desc: string; fortune: string }> = {
  '비견': {
    category: '형제성 (兄弟星)',
    desc: '비견은 나와 같은 오행·같은 음양의 별로, 형제·동료·경쟁자를 상징합니다.',
    fortune: '독립심과 자존심이 강하며, 협력보다 단독 행동을 선호합니다. 동업 시 갈등에 주의하세요.',
  },
  '겁재': {
    category: '형제성 (兄弟星)',
    desc: '겁재는 같은 오행이나 다른 음양으로, 강한 경쟁자·재물을 빼앗는 기운을 상징합니다.',
    fortune: '추진력이 강하나 충동적 결정을 조심하세요. 재물 손실에 주의가 필요합니다.',
  },
  '식신': {
    category: '표현성 (表現星)',
    desc: '식신은 일간이 생하는 오행·같은 음양으로, 재능·식복·창의성을 상징합니다.',
    fortune: '예술적 감각과 표현력이 뛰어나고 식복이 좋습니다. 여유롭고 즐거운 기운입니다.',
  },
  '상관': {
    category: '표현성 (表現星)',
    desc: '상관은 일간이 생하는 오행·다른 음양으로, 총명함·반항심·창의적 재능을 상징합니다.',
    fortune: '뛰어난 재치와 언변이 있으나, 권위에 반발하는 성향이 있습니다. 관직·직장에서 충돌 주의.',
  },
  '편재': {
    category: '재성 (財星)',
    desc: '편재는 일간이 극하는 오행·같은 음양으로, 편의성 재물·투기·아버지를 상징합니다.',
    fortune: '투자와 사업 기회를 포착하는 능력이 있습니다. 위험을 감수한 큰 수익도 가능합니다.',
  },
  '정재': {
    category: '재성 (財星)',
    desc: '정재는 일간이 극하는 오행·다른 음양으로, 안정적인 재물·성실함을 상징합니다.',
    fortune: '꼼꼼하고 계획적인 재물 관리에 강점이 있습니다. 안정적이고 지속적인 수입을 추구합니다.',
  },
  '편관': {
    category: '관성 (官星)',
    desc: '편관(七殺)은 일간을 극하는 오행·같은 음양으로, 압박·도전·무관을 상징합니다.',
    fortune: '강한 의지로 역경을 돌파하는 힘이 있습니다. 스트레스와 경쟁이 많지만 그만큼 성장합니다.',
  },
  '정관': {
    category: '관성 (官星)',
    desc: '정관은 일간을 극하는 오행·다른 음양으로, 명예·규범·관직을 상징합니다.',
    fortune: '원칙과 책임감이 강하며 사회적 평판이 높습니다. 공직·관리직에서 강점을 발휘합니다.',
  },
  '편인': {
    category: '인성 (印星)',
    desc: '편인(梟神)은 일간을 생하는 오행·같은 음양으로, 편학·종교·이색적 재능을 상징합니다.',
    fortune: '독창적 사고와 특수한 기술을 지닙니다. 외로움을 느끼기 쉽고, 의존 관계에 주의하세요.',
  },
  '정인': {
    category: '인성 (印星)',
    desc: '정인은 일간을 생하는 오행·다른 음양으로, 학문·어머니·지식·인자함을 상징합니다.',
    fortune: '학습 능력과 윤리의식이 뛰어납니다. 어머니의 도움이나 귀인의 후원을 받기 좋습니다.',
  },
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

  // ── Pillar detail modal state ────────────────────────────────────────────
  const [modalPillarKey, setModalPillarKey] = useState<'year' | 'month' | 'day' | 'hour' | null>(null);
  const [modalStem, setModalStem]   = useState<Stem | null>(null);
  const [modalBranch, setModalBranch] = useState<Branch | null>(null);

  function openPillarDetail(key: 'year' | 'month' | 'day' | 'hour', stem: Stem, branch: Branch) {
    setModalPillarKey(key);
    setModalStem(stem);
    setModalBranch(branch);
  }
  function closeModal() { setModalPillarKey(null); setModalStem(null); setModalBranch(null); }

  // ── Info modal state (오행 / 십신 / 대운) ─────────────────────────────────
  type InfoModal =
    | { kind: 'element'; element: FiveElement; score: number }
    | { kind: 'shishin'; shishin: ShiShin; pillarLabel: string }
    | { kind: 'daewoon'; dw: DaewoonPeriod; isCurrent: boolean };
  const [infoModal, setInfoModal] = useState<InfoModal | null>(null);

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

  // ── Current 대운 index (만 나이 기준) ────────────────────────────────────────
  function calcManAge(): number {
    if (!birthData) return -1;
    const now = new Date();
    const bMonth = birthData.month ?? 1;
    const bDay   = birthData.day   ?? 1;
    const hadBirthday =
      now.getMonth() + 1 > bMonth ||
      (now.getMonth() + 1 === bMonth && now.getDate() >= bDay);
    return now.getFullYear() - birthData.year - (hadBirthday ? 0 : 1);
  }
  const currentAge = calcManAge();
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
    <>
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
              <TouchableOpacity
                key={p.key}
                style={styles.pillar}
                onPress={() => openPillarDetail(p.key as 'year' | 'month' | 'day' | 'hour', p.stem, p.branch)}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
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
            <TouchableOpacity
              key={r.key}
              style={styles.elementRow}
              onPress={() => setInfoModal({ kind: 'element', element: r.key, score: r.score })}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
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
            <TouchableOpacity
              key={p.key}
              style={[styles.tableRow, p.isDay && styles.tableRowDay]}
              onPress={() => {
                if (!p.isDay && p.shiShin) setInfoModal({ kind: 'shishin', shishin: p.shiShin, pillarLabel: p.label });
              }}
              activeOpacity={p.isDay || !p.shiShin ? 1 : 0.7}
            >
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
            </TouchableOpacity>
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
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.daewoonCard,
                    { borderColor: isCurrent ? T.semantic.gold : T.border.default },
                    isCurrent && { backgroundColor: T.semantic.gold + '0d' },
                  ]}
                  onPress={() => setInfoModal({ kind: 'daewoon', dw, isCurrent })}
                  activeOpacity={0.75}
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
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── Content Recommendation ── */}
      <ContentRecommendationSection frame={frame ?? 'en'} />

      <View style={{ height: 48 }} />
    </ScrollView>

    {/* ── Info Modal (오행 / 십신 / 대운) ── */}
    <Modal
      visible={infoModal !== null}
      animationType="slide"
      transparent
      onRequestClose={() => setInfoModal(null)}
    >
      <TouchableOpacity style={styles.infoBackdrop} activeOpacity={1} onPress={() => setInfoModal(null)} />
      <View style={styles.infoSheet}>
        <View style={styles.infoHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {infoModal?.kind === 'element' && (() => {
            const info = ELEMENT_INFO[infoModal.element];
            const color = ELEM_COLOR[infoModal.element];
            const total = elementRows.reduce((s, r) => s + r.score, 0) || 1;
            const pct = Math.round((infoModal.score / total) * 100);
            const level = infoModal.score === 0 ? '없음' : infoModal.score >= Math.ceil(total / 3) ? '강함' : '약함';
            return (
              <>
                <Text style={[styles.infoTitle, { color }]}>{info.symbol} {infoModal.element} {t(`common:elements.${ELEM_KEY[infoModal.element]}`)}</Text>
                <Text style={styles.infoSubtitle}>{info.season}의 기운 · {pct}% ({level})</Text>
                <Text style={styles.infoDesc}>{info.desc}</Text>
                <View style={[styles.infoHighlight, { borderLeftColor: color }]}>
                  <Text style={styles.infoHighlightLabel}>{infoModal.score > 0 ? '💪 강할 때' : '🔍 부족할 때'}</Text>
                  <Text style={styles.infoHighlightText}>{infoModal.score > 0 ? info.strong : info.weak}</Text>
                </View>
              </>
            );
          })()}

          {infoModal?.kind === 'shishin' && (() => {
            const info = SHISHIN_INFO[infoModal.shishin];
            return (
              <>
                <Text style={styles.infoTitle}>{infoModal.shishin}</Text>
                <Text style={styles.infoSubtitle}>{infoModal.pillarLabel} · {info.category}</Text>
                <Text style={styles.infoDesc}>{info.desc}</Text>
                <View style={[styles.infoHighlight, { borderLeftColor: T.primary.DEFAULT }]}>
                  <Text style={styles.infoHighlightLabel}>✨ 운세</Text>
                  <Text style={styles.infoHighlightText}>{info.fortune}</Text>
                </View>
              </>
            );
          })()}

          {infoModal?.kind === 'daewoon' && (() => {
            const { dw, isCurrent } = infoModal;
            const dwStemEl = STEM_ELEMENT[dw.pillar.stem];
            const dwBranchEl = BRANCH_ELEMENT[dw.pillar.branch];
            const dwColor = ELEM_COLOR[dw.element];
            return (
              <>
                <Text style={[styles.infoTitle, { color: isCurrent ? T.semantic.gold : T.text.primary }]}>
                  {dw.pillar.stem}{dw.pillar.branch} 대운
                  {isCurrent ? '  ★ 현재' : ''}
                </Text>
                <Text style={styles.infoSubtitle}>{dw.startAge}–{dw.startAge + 9}세</Text>
                <View style={styles.infoDwRow}>
                  <View style={[styles.infoDwBox, { borderColor: ELEM_COLOR[dwStemEl] }]}>
                    <Text style={[styles.infoDwChar, { color: ELEM_COLOR[dwStemEl] }]}>{dw.pillar.stem}</Text>
                    <Text style={[styles.infoDwLabel, { color: ELEM_COLOR[dwStemEl] }]}>천간</Text>
                  </View>
                  <View style={[styles.infoDwBox, { borderColor: ELEM_COLOR[dwBranchEl] }]}>
                    <Text style={[styles.infoDwChar, { color: ELEM_COLOR[dwBranchEl] }]}>{dw.pillar.branch}</Text>
                    <Text style={[styles.infoDwLabel, { color: ELEM_COLOR[dwBranchEl] }]}>지지</Text>
                  </View>
                </View>
                <View style={[styles.infoHighlight, { borderLeftColor: dwColor }]}>
                  <Text style={styles.infoHighlightLabel}>🌊 오행 기운</Text>
                  <Text style={styles.infoHighlightText}>
                    {dw.element === dayStemEl
                      ? `${t(`common:elements.${ELEM_KEY[dw.element]}`)} 기운이 일간(${dayStem})과 같은 오행입니다. 나의 본래 에너지가 강화되는 시기입니다.`
                      : `${t(`common:elements.${ELEM_KEY[dw.element]}`)} 기운이 들어옵니다. ${ELEMENT_INFO[dw.element].desc}`}
                  </Text>
                </View>
              </>
            );
          })()}

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </Modal>

    {/* ── Pillar Detail Modal ── */}
    <PillarDetailModal
      visible={modalPillarKey !== null}
      pillarKey={modalPillarKey}
      stem={modalStem}
      branch={modalBranch}
      onClose={closeModal}
    />
    </>
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

  // Info modal
  infoBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  infoSheet: {
    backgroundColor: T.bg.elevated,
    borderTopLeftRadius: T.radius['2xl'],
    borderTopRightRadius: T.radius['2xl'],
    paddingHorizontal: T.spacing[6],
    paddingBottom: T.spacing[4],
    maxHeight: '72%',
  },
  infoHandle: {
    width: 40, height: 4, backgroundColor: T.border.default,
    borderRadius: 2, alignSelf: 'center',
    marginTop: T.spacing[3], marginBottom: T.spacing[4],
  },
  infoTitle: {
    fontSize: T.fontSize['2xl'], fontWeight: '800', color: T.text.primary,
    marginBottom: T.spacing[1],
  },
  infoSubtitle: {
    fontSize: T.fontSize.sm, color: T.text.faint, marginBottom: T.spacing[4], fontWeight: '600',
  },
  infoDesc: {
    fontSize: T.fontSize.base, color: T.text.secondary, lineHeight: 22,
    marginBottom: T.spacing[4],
  },
  infoHighlight: {
    borderLeftWidth: 3, paddingLeft: T.spacing[4],
    backgroundColor: T.bg.card, borderRadius: T.radius.md,
    padding: T.spacing[4], marginBottom: T.spacing[4],
  },
  infoHighlightLabel: {
    fontSize: T.fontSize.xs, color: T.text.faint, fontWeight: '700', marginBottom: T.spacing[2],
  },
  infoHighlightText: { fontSize: T.fontSize.sm, color: T.text.secondary, lineHeight: 20 },
  infoDwRow: { flexDirection: 'row', gap: T.spacing[4], marginBottom: T.spacing[4] },
  infoDwBox: {
    flex: 1, alignItems: 'center', paddingVertical: T.spacing[4],
    borderRadius: T.radius.md, borderWidth: 1.5,
    backgroundColor: T.bg.card,
  },
  infoDwChar: { fontSize: 48, fontWeight: '800', lineHeight: 56 },
  infoDwLabel: { fontSize: T.fontSize.xs, fontWeight: '700', marginTop: 4 },

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
