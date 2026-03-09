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

// Normalize element: old engine dist returned English ('Wood') instead of kanji ('木')
const ENGLISH_TO_KANJI: Record<string, FiveElement> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};
function normElement(el: string | undefined): FiveElement | undefined {
  if (!el) return undefined;
  if (el in ELEM_KEY) return el as FiveElement;
  return ENGLISH_TO_KANJI[el];
}

// ── Element symbols (emoji — language-agnostic) ──────────────────────────────

const ELEMENT_SYMBOL: Record<FiveElement, string> = {
  木: '🌳', 火: '🔥', 土: '⛰️', 金: '⚔️', 水: '🌊',
};

// ── Stem pinyin (Latin — universal) ──────────────────────────────────────────

const STEM_PINYIN: Record<Stem, string> = {
  甲: 'jiǎ', 乙: 'yǐ', 丙: 'bǐng', 丁: 'dīng', 戊: 'wù',
  己: 'jǐ', 庚: 'gēng', 辛: 'xīn', 壬: 'rén', 癸: 'guǐ',
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
                    {p.isDay ? t('chart:dayMaster') : (p.shiShin ? t(`chart:shishin.${p.shiShin}`) : '')}
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
                if (p.isDay) {
                  openPillarDetail('day', p.stem, p.branch);
                } else if (p.shiShin) {
                  setInfoModal({ kind: 'shishin', shishin: p.shiShin, pillarLabel: p.label });
                }
              }}
              activeOpacity={p.isDay || p.shiShin ? 0.7 : 1}
            >
              <Text style={[styles.cell, styles.cellText, p.isDay && { color: T.semantic.gold }]}>
                {p.label}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[stemEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.stem}
              </Text>
              <Text style={[styles.cell, styles.cellWide, styles.cellText, p.isDay && { color: T.semantic.gold, fontWeight: '700' }]}>
                {p.isDay ? t('chart:dayMaster') : (p.shiShin ? t(`chart:shishin.${p.shiShin}`) : '')}
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
              const dwElem = normElement(dw.element) ?? dwBranchEl;
              const dwColor = ELEM_COLOR[dwElem];
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.daewoonCard,
                    { borderColor: isCurrent ? T.semantic.gold : T.border.default },
                    isCurrent && { backgroundColor: T.semantic.gold + '0d' },
                  ]}
                  onPress={() => { try { setInfoModal({ kind: 'daewoon', dw, isCurrent }); } catch (e) { console.warn('[Daewoon] onPress error:', e); } }}
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
            const elemKey = ELEM_KEY[infoModal.element];
            const symbol = ELEMENT_SYMBOL[infoModal.element];
            const color = ELEM_COLOR[infoModal.element];
            const total = elementRows.reduce((s, r) => s + r.score, 0) || 1;
            const pct = Math.round((infoModal.score / total) * 100);
            const level = infoModal.score === 0 ? t('chart:modal.none') : infoModal.score >= Math.ceil(total / 3) ? t('chart:modal.strong') : t('chart:modal.weak');
            return (
              <>
                <Text style={[styles.infoTitle, { color }]}>{symbol} {infoModal.element}</Text>
                <Text style={styles.infoSubtitle}>{t('chart:modal.seasonOf', { season: t(`chart:elementInfo.${elemKey}.season`) })} · {pct}% ({level})</Text>
                <Text style={styles.infoDesc}>{t(`chart:elementInfo.${elemKey}.desc`)}</Text>
                <View style={[styles.infoHighlight, { borderLeftColor: color }]}>
                  <Text style={styles.infoHighlightLabel}>{infoModal.score > 0 ? t('chart:modal.whenStrong') : t('chart:modal.whenWeak')}</Text>
                  <Text style={styles.infoHighlightText}>{infoModal.score > 0 ? t(`chart:elementInfo.${elemKey}.strong`) : t(`chart:elementInfo.${elemKey}.weak`)}</Text>
                </View>
              </>
            );
          })()}

          {infoModal?.kind === 'shishin' && (() => {
            const ssKey = infoModal.shishin;
            return (
              <>
                <Text style={styles.infoTitle}>{t(`chart:shishin.${ssKey}`)}</Text>
                <Text style={styles.infoSubtitle}>{infoModal.pillarLabel} · {t(`chart:shishinInfo.${ssKey}.category`)}</Text>
                <Text style={styles.infoDesc}>{t(`chart:shishinInfo.${ssKey}.desc`)}</Text>
                <View style={[styles.infoHighlight, { borderLeftColor: T.primary.DEFAULT }]}>
                  <Text style={styles.infoHighlightLabel}>{t('chart:modal.fortuneLabel')}</Text>
                  <Text style={styles.infoHighlightText}>{t(`chart:shishinInfo.${ssKey}.fortune`)}</Text>
                </View>
              </>
            );
          })()}

          {infoModal?.kind === 'daewoon' && (() => {
            const { dw, isCurrent } = infoModal;
            const dwStemEl = STEM_ELEMENT[dw.pillar.stem];
            const dwBranchEl = BRANCH_ELEMENT[dw.pillar.branch];
            const dwElem = normElement(dw.element) ?? dwBranchEl;
            const dwColor = ELEM_COLOR[dwElem];
            const dwElemKey = ELEM_KEY[dwElem];
            const dwIdx = daewoon.findIndex((d) => d.startAge === dw.startAge);
            const prevDw = dwIdx > 0 ? daewoon[dwIdx - 1] : null;
            const nextDw = dwIdx >= 0 && dwIdx < daewoon.length - 1 ? daewoon[dwIdx + 1] : null;
            const stemPinyin = STEM_PINYIN[dw.pillar.stem] ?? '';
            const keywords = t(`chart:dwKeywords.${dwElemKey}`).split('|');
            const dwElemSymbol = ELEMENT_SYMBOL[dwElem];
            return (
              <>
                {/* Title */}
                <Text style={[styles.infoTitle, { color: isCurrent ? T.semantic.gold : T.text.primary }]}>
                  {t('chart:modal.daewoonTitle', { pillars: `${dw.pillar.stem}${dw.pillar.branch}` })}{isCurrent ? `  ${t('chart:modal.currentStar')}` : ''}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {dw.startAge}–{dw.startAge + 9}{t('chart:ageSuffix')}{isCurrent ? ` · ${t('chart:modal.inProgress')}` : ''}
                </Text>

                {/* Stem / Branch boxes with meanings */}
                <View style={styles.infoDwRow}>
                  <View style={[styles.infoDwBox, { borderColor: ELEM_COLOR[dwStemEl] }]}>
                    <Text style={[styles.infoDwChar, { color: ELEM_COLOR[dwStemEl] }]}>{dw.pillar.stem}</Text>
                    <Text style={[styles.infoDwLabel, { color: ELEM_COLOR[dwStemEl] }]}>{t('chart:modal.heavenlyStem')} · {stemPinyin}</Text>
                    <Text style={styles.infoDwMeaning}>{t(`chart:stemDesc.${dw.pillar.stem}.meaning`)}</Text>
                  </View>
                  <View style={[styles.infoDwBox, { borderColor: ELEM_COLOR[dwBranchEl] }]}>
                    <Text style={[styles.infoDwChar, { color: ELEM_COLOR[dwBranchEl] }]}>{dw.pillar.branch}</Text>
                    <Text style={[styles.infoDwLabel, { color: ELEM_COLOR[dwBranchEl] }]}>{t('chart:modal.earthlyBranch')} · {t(`chart:branchDesc.${dw.pillar.branch}.animal`)}</Text>
                    <Text style={styles.infoDwMeaning}>{t(`chart:branchDesc.${dw.pillar.branch}.meaning`)}</Text>
                  </View>
                </View>

                {/* Element energy */}
                <View style={[styles.infoHighlight, { borderLeftColor: dwColor }]}>
                  <Text style={styles.infoHighlightLabel}>{dwElemSymbol} {t('chart:modal.elementEnergy')} · {t(`common:elements.${dwElemKey}`)}</Text>
                  <Text style={styles.infoHighlightText}>
                    {dwElem === dayStemEl
                      ? t('chart:modal.sameElem', { element: t(`common:elements.${dwElemKey}`), stem: dayStem })
                      : t(`chart:elementInfo.${dwElemKey}.desc`)}
                  </Text>
                </View>

                {/* Period summary */}
                <View style={[styles.infoHighlight, { borderLeftColor: T.primary.DEFAULT }]}>
                  <Text style={styles.infoHighlightLabel}>{t('chart:modal.periodFlow')}</Text>
                  <Text style={styles.infoHighlightText}>
                    {t(`chart:stemDesc.${dw.pillar.stem}.fortune`)}{'\n'}{t(`chart:branchDesc.${dw.pillar.branch}.fortune`)}
                  </Text>
                </View>

                {/* Keywords */}
                {keywords.length > 0 && (
                  <View style={styles.infoDwKeywordRow}>
                    {keywords.map((kw) => (
                      <View key={kw} style={[styles.infoDwKeywordPill, { backgroundColor: dwColor + '22', borderColor: dwColor + '66' }]}>
                        <Text style={[styles.infoDwKeywordText, { color: dwColor }]}>{kw}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Advice */}
                <>
                  <View style={[styles.infoHighlight, { borderLeftColor: '#22c55e' }]}>
                    <Text style={styles.infoHighlightLabel}>{t('chart:modal.favorLabel')}</Text>
                    <Text style={styles.infoHighlightText}>{t(`chart:dwAdvice.${dwElemKey}.favor`)}</Text>
                  </View>
                  <View style={[styles.infoHighlight, { borderLeftColor: '#eab308' }]}>
                    <Text style={styles.infoHighlightLabel}>{t('chart:modal.cautionLabel')}</Text>
                    <Text style={styles.infoHighlightText}>{t(`chart:dwAdvice.${dwElemKey}.caution`)}</Text>
                  </View>
                </>

                {/* Previous / Current / Next flow */}
                {(prevDw || nextDw) && (
                  <View style={[styles.infoHighlight, { borderLeftColor: T.border.default }]}>
                    <Text style={styles.infoHighlightLabel}>{t('chart:modal.flowLabel')}</Text>
                    <View style={styles.infoDwFlow}>
                      {prevDw && (
                        <View style={styles.infoDwFlowItem}>
                          <Text style={[styles.infoDwFlowChar, { color: ELEM_COLOR[normElement(prevDw.element) ?? BRANCH_ELEMENT[prevDw.pillar.branch]] + 'aa' }]}>
                            {prevDw.pillar.stem}{prevDw.pillar.branch}
                          </Text>
                          <Text style={styles.infoDwFlowAge}>{prevDw.startAge}–{prevDw.startAge + 9}{t('chart:ageSuffix')}</Text>
                          <Text style={styles.infoDwFlowLabel}>{t('chart:modal.prevLabel')}</Text>
                        </View>
                      )}
                      <View style={[styles.infoDwFlowItem, styles.infoDwFlowCurrent]}>
                        <Text style={[styles.infoDwFlowChar, { color: isCurrent ? T.semantic.gold : dwColor }]}>
                          {dw.pillar.stem}{dw.pillar.branch}
                        </Text>
                        <Text style={[styles.infoDwFlowAge, isCurrent && { color: T.semantic.gold }]}>
                          {dw.startAge}–{dw.startAge + 9}{t('chart:ageSuffix')}
                        </Text>
                        <Text style={[styles.infoDwFlowLabel, isCurrent && { color: T.semantic.gold }]}>
                          {isCurrent ? t('chart:modal.currentStar') : t('chart:modal.selectedLabel')}
                        </Text>
                      </View>
                      {nextDw && (
                        <View style={styles.infoDwFlowItem}>
                          <Text style={[styles.infoDwFlowChar, { color: ELEM_COLOR[normElement(nextDw.element) ?? BRANCH_ELEMENT[nextDw.pillar.branch]] + 'aa' }]}>
                            {nextDw.pillar.stem}{nextDw.pillar.branch}
                          </Text>
                          <Text style={styles.infoDwFlowAge}>{nextDw.startAge}–{nextDw.startAge + 9}{t('chart:ageSuffix')}</Text>
                          <Text style={styles.infoDwFlowLabel}>{t('chart:modal.nextLabel')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
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
  infoDwMeaning: { fontSize: 9, color: T.text.faint, marginTop: 3, textAlign: 'center', paddingHorizontal: 4 },
  infoDwKeywordRow: { flexDirection: 'row', gap: T.spacing[2], marginBottom: T.spacing[4], flexWrap: 'wrap' },
  infoDwKeywordPill: {
    borderRadius: T.radius.lg, borderWidth: 1,
    paddingHorizontal: T.spacing[3], paddingVertical: T.spacing[1] + 1,
  },
  infoDwKeywordText: { fontSize: T.fontSize.sm, fontWeight: '700' },
  infoDwFlow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: T.spacing[2] },
  infoDwFlowItem: { alignItems: 'center', flex: 1 },
  infoDwFlowCurrent: {
    borderWidth: 1, borderColor: T.border.default,
    borderRadius: T.radius.md, paddingVertical: T.spacing[2],
    backgroundColor: T.bg.card,
  },
  infoDwFlowChar: { fontSize: 20, fontWeight: '800' },
  infoDwFlowAge: { fontSize: 9, color: T.text.faint, marginTop: 2 },
  infoDwFlowLabel: { fontSize: 9, color: T.text.disabled, marginTop: 2, fontWeight: '600' },

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
