/**
 * My Saju Chart Screen — issue #9 / design-system #31
 *
 * Displays the full 사주팔자 analysis:
 *  - 8-character (4-pillar) grid with element colours & 십신 badges
 *  - 오행 balance bar chart (graduated)
 *  - 십신 (Ten Gods) table
 *  - 대운 (Major Luck Cycle) horizontal timeline — current period highlighted
 */
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSajuStore } from '../../src/store/sajuStore';
import { getShiShin, STEM_ELEMENT, BRANCH_ELEMENT } from '@k-saju/saju-engine';
import { ContentRecommendationSection } from '../../src/components/ContentRecommendationSection';
import { T } from '../../src/theme/tokens';
import type {
  CulturalFrame,
  FiveElement,
  Stem,
  Branch,
  ShiShin,
} from '@k-saju/saju-engine';

// ── Element colours & labels ───────────────────────────────────────────────────

const ELEM_COLOR: Record<FiveElement, string> = T.element;

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
  shiShin: ShiShin | null;
  isDay: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Pillar detail descriptions ────────────────────────────────────────────────

const STEM_DESC: Record<string, string> = {
  甲:'甲木 — 큰 나무, 양목. 리더십, 직진성, 성장력.',
  乙:'乙木 — 풀·넝쿨, 음목. 유연성, 적응력, 섬세함.',
  丙:'丙火 — 태양, 양화. 열정, 카리스마, 표현력.',
  丁:'丁火 — 촛불, 음화. 따뜻함, 집중력, 신중함.',
  戊:'戊土 — 큰 산, 양토. 안정성, 포용력, 신뢰감.',
  己:'己土 — 전답, 음토. 세심함, 실용성, 봉사심.',
  庚:'庚金 — 원석, 양금. 결단력, 의리, 강직함.',
  辛:'辛金 — 보석, 음금. 예민함, 완벽주의, 심미안.',
  壬:'壬水 — 큰 강, 양수. 지혜, 도량, 추진력.',
  癸:'癸水 — 이슬비, 음수. 직관력, 섬세함, 내면 깊이.',
};

const BRANCH_DESC: Record<string, string> = {
  子:'子(자) 🐭 — 수. 지혜, 탐구심, 밤의 에너지.',
  丑:'丑(축) 🐂 — 토. 인내, 근면, 묵묵한 추진력.',
  寅:'寅(인) 🐯 — 목. 용기, 행동력, 새 시작.',
  卯:'卯(묘) 🐰 — 목. 온화함, 직관, 봄의 에너지.',
  辰:'辰(진) 🐲 — 토. 포부, 카리스마, 변화.',
  巳:'巳(사) 🐍 — 화. 지혜, 집중력, 예리함.',
  午:'午(오) 🐴 — 화. 열정, 명예, 활동성.',
  未:'未(미) 🐑 — 토. 배려, 예술성, 여름의 감성.',
  申:'申(신) 🐒 — 금. 재치, 변화, 다재다능.',
  酉:'酉(유) 🐓 — 금. 섬세함, 완벽, 추수의 기운.',
  戌:'戌(술) 🐶 — 토. 의리, 정직, 가을의 결실.',
  亥:'亥(해) 🐷 — 수. 자유로움, 창의, 직관력.',
};

// ── 십신 상세 설명 ──────────────────────────────────────────────────────────

// Keys match ShiShin type from saju-engine (Korean): '비견'|'겁재'|'식신'|'상관'|'편재'|'정재'|'편관'|'정관'|'편인'|'정인'
const SHISHIN_DESC: Record<string, string> = {
  '비견':'비견(比肩) — 나와 같은 오행·음양.\n독립심, 자존심, 경쟁심이 강합니다. 내 뜻대로 밀고 나가는 힘이 있으나 고집이 세질 수 있습니다. 동업·협력보다 단독 추진에 유리합니다.',
  '겁재':'겁재(劫財) — 나와 같은 오행, 반대 음양.\n추진력, 승부욕, 변화 적응력이 뛰어납니다. 재물 흐름이 빠르고 인맥이 넓습니다. 재물 지출에 주의가 필요합니다.',
  '식신':'식신(食神) — 내가 생하는 오행·음양.\n표현력, 창의성, 여유가 넘칩니다. 즐기며 일하는 기질로 먹복과 의식주 복이 따릅니다. 예술·서비스 분야에 적합합니다.',
  '상관':'상관(傷官) — 내가 생하는 오행, 반대 음양.\n재능, 혁신 에너지, 비판 능력이 강합니다. 틀을 벗어나는 창의력이 돋보이며 예술·연구·기획에서 두각을 나타냅니다.',
  '편재':'편재(偏財) — 내가 극하는 오행·음양.\n활동적 재물운, 사업 수완, 인맥 활용에 탁월합니다. 큰 돈이 들어오지만 지출도 과감합니다. 투자·영업 적성이 있습니다.',
  '정재':'정재(正財) — 내가 극하는 오행, 반대 음양.\n안정적 재물, 성실함, 현실 감각이 강합니다. 꾸준히 모으고 지키는 재물운으로 직장·저축 재물에 유리합니다.',
  '편관':'편관(偏官) — 나를 극하는 오행·음양.\n추진력, 권력 지향, 강렬한 에너지를 지닙니다. 도전적 상황에서 빛을 발하며 군경·법조·경영자에 적합합니다.',
  '정관':'정관(正官) — 나를 극하는 오행, 반대 음양.\n책임감, 도덕성, 공직·조직 적합성이 높습니다. 규율과 명예를 중시하며 관직·전문직에 어울립니다.',
  '편인':'편인(偏印) — 나를 생하는 오행·음양.\n직관력, 예술성, 이색 학문에 밝습니다. 정통보다 특이한 분야에서 두각을 나타내며 종교·역술·예술에 강합니다.',
  '정인':'정인(正印) — 나를 생하는 오행, 반대 음양.\n학습 능력, 모성애, 보호받는 에너지가 강합니다. 자격·학위를 통해 안정을 찾으며 교육·복지 분야에 적합합니다.',
};

// ── 오행 상세 설명 ──────────────────────────────────────────────────────────

const ELEM_DETAIL: Record<FiveElement, { trait: string; career: string; gen: string }> = {
  木: { trait: '리더십, 직진성, 창의력이 강합니다. 시작하고 성장시키는 에너지입니다.', career: '기획·교육·창업·디자인 분야와 잘 맞습니다.', gen: '水(수)가 木(목)을 생합니다 — 지혜와 유연함이 성장 에너지를 뒷받침합니다.' },
  火: { trait: '표현력, 카리스마, 열정이 넘칩니다. 빛나고 전파하는 에너지입니다.', career: '영업·엔터·마케팅·교육 분야와 잘 맞습니다.', gen: '木(목)이 火(화)를 생합니다 — 창의적 아이디어가 열정을 지속시킵니다.' },
  土: { trait: '포용력, 신뢰감, 현실 감각이 강합니다. 중심을 잡아주는 에너지입니다.', career: '부동산·금융·행정·서비스 분야와 잘 맞습니다.', gen: '火(화)가 土(토)를 생합니다 — 열정과 실행력이 안정을 강화합니다.' },
  金: { trait: '결단력, 의리, 완벽주의 기질이 있습니다. 가다듬고 완성하는 에너지입니다.', career: '법조·군경·제조·금융·의료 분야와 잘 맞습니다.', gen: '土(토)가 金(금)을 생합니다 — 안정된 기반이 결단력을 키웁니다.' },
  水: { trait: '직관력, 유연성, 내면 깊이가 있습니다. 흐르고 스며드는 에너지입니다.', career: '연구·철학·IT·유통·무역 분야와 잘 맞습니다.', gen: '金(금)이 水(수)를 생합니다 — 결단과 의지가 지혜를 뒷받침합니다.' },
};

export default function ChartScreen() {
  const { t } = useTranslation('common');
  const { chart, daewoon, frame, birthData } = useSajuStore();
  const labels = FRAME_LABELS[frame ?? 'en'];

  const [detailChar, setDetailChar] = useState<string | null>(null);
  const detailText = detailChar
    ? (STEM_DESC[detailChar] ?? BRANCH_DESC[detailChar] ?? detailChar)
    : '';

  const [sectionInfo, setSectionInfo] = useState<{ title: string; body: string } | null>(null);

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
  const maxScore = Math.max(...elementRows.map((r) => r.score), 1);

  // ── Personalised section info (computed from user chart) ─────────────────

  // 오행 균형: 과다/부족 분석
  const sortedByScore = [...elementRows].sort((a, b) => b.score - a.score);
  const strongest = sortedByScore[0];
  const weakest   = sortedByScore[sortedByScore.length - 1];
  const elemLines = elementRows.map((r) => {
    const level = r.score === 0 ? '부재 ✗' : r.score === 1 ? '부족 ▽' : r.score >= 4 ? '과다 ▲' : '균형 ◆';
    return `${r.key}(${ELEM_EN[r.key]}) ${r.score}점 — ${level}`;
  }).join('\n');
  const elemAdvice = weakest.score === 0
    ? `부재한 기운: ${weakest.key}(${ELEM_EN[weakest.key]})\n${ELEM_DETAIL[weakest.key].gen}\n→ 이 에너지 보완이 필요합니다.`
    : weakest.score === 1
    ? `약한 기운: ${weakest.key}(${ELEM_EN[weakest.key]}) ${weakest.score}점\n${ELEM_DETAIL[weakest.key].gen}`
    : '나의 오행이 비교적 균형을 이루고 있습니다.';

  // 십신: 일간 기준 각 주(柱)의 십신 나열
  const tenGodsLines = pillarList
    .filter((p) => !p.isDay && p.shiShin)
    .map((p) => `${p.label}(${p.stem}) — ${p.shiShin}\n${SHISHIN_DESC[p.shiShin!]?.split('\n')[0] ?? ''}`)
    .join('\n\n');

  // 대운: 현재 대운 중심 설명
  const currentDw = currentDwIdx >= 0 ? daewoon[currentDwIdx] : null;
  const luckCycleBody = currentDw
    ? `현재 대운 (${currentDw.startAge}–${currentDw.startAge + 9}${labels.ageSuffix}):\n\n` +
      `천간 ${currentDw.pillar.stem} — ${STEM_DESC[currentDw.pillar.stem] ?? ''}\n\n` +
      `지지 ${currentDw.pillar.branch} — ${BRANCH_DESC[currentDw.pillar.branch] ?? ''}\n\n` +
      `대운은 10년 단위로 변하는 운의 큰 흐름입니다. 이 기간의 천간·지지가 나의 사주와 어떻게 상생·상극하는지에 따라 전반적인 운세 방향이 결정됩니다.`
    : '대운(大運)은 10년 단위로 변하는 운의 흐름입니다.\n\n월주를 기준으로 순행 또는 역행하여 산출합니다.';

  const SECTION_INFO = {
    dayMaster: {
      title: labels.dayMaster,
      body: `일간(日干)은 사주팔자에서 '나 자신'을 나타내는 가장 핵심 글자입니다.\n\n${STEM_DESC[dayStem] ?? ''}\n\n일간의 오행과 음양이 성격·기질·삶의 방식을 결정합니다. 사주의 나머지 7글자는 모두 일간과의 관계(십신)로 해석됩니다.`,
    },
    element: {
      title: labels.elementBalance,
      body: `나의 오행 분포:\n\n${elemLines}\n\n강한 기운: ${strongest.key}(${ELEM_EN[strongest.key]}) ${strongest.score}점\n${ELEM_DETAIL[strongest.key].trait}\n${ELEM_DETAIL[strongest.key].career}\n\n${elemAdvice}`,
    },
    tenGods: {
      title: labels.tenGods,
      body: `일간 ${dayStem} 기준 십신 분석:\n\n${tenGodsLines}\n\n십신의 강약과 분포가 직업운·재물운·대인관계의 방향을 결정합니다.`,
    },
    luckCycle: {
      title: labels.luckCycle,
      body: luckCycleBody,
    },
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <Text style={styles.title}>{labels.title}</Text>
      <Text style={styles.subtitle}>{labels.subtitle}</Text>

      {/* ── Day Master pill ── */}
      <TouchableOpacity style={styles.dayMasterRow} onPress={() => setSectionInfo(SECTION_INFO.dayMaster)} activeOpacity={0.7}>
        <Text style={styles.dayMasterLabel}>{labels.dayMaster}</Text>
        <View style={[
          styles.dayMasterPill,
          { backgroundColor: dayStemColor + '22', borderColor: dayStemColor },
        ]}>
          <Text style={[styles.dayMasterChar, { color: dayStemColor }]}>{dayStem}</Text>
          <Text style={[styles.dayMasterElem, { color: dayStemColor }]}>
            {' '}{t(`elements.${ELEM_EN[dayStemEl]}`)}
          </Text>
        </View>
        <Text style={[styles.sectionDeco, { marginLeft: 8 }]}>ⓘ</Text>
      </TouchableOpacity>

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
                onPress={() => setDetailChar(p.stem)}
                activeOpacity={0.75}
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
                    {p.isDay ? labels.dayMaster : (p.shiShin ?? '')}
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

                <Text style={[styles.branchElem, { color: bc + 'aa' }]}>{branchEl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Element Balance ── */}
      <TouchableOpacity style={styles.sectionHeader} onPress={() => { console.log('[chart] section tap: element'); setSectionInfo(SECTION_INFO.element); }} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>{labels.elementBalance}</Text>
        <Text style={styles.sectionDeco}>오행 ⓘ</Text>
      </TouchableOpacity>
      <View style={styles.elementSection}>
        {elementRows.map((r) => {
          const pct = r.score / maxScore;
          const detail = ELEM_DETAIL[r.key];
          return (
            <TouchableOpacity
              key={r.key}
              style={styles.elementRow}
              activeOpacity={0.7}
              onPress={() => setSectionInfo({
                title: `${r.key} ${ELEM_EN[r.key]} — ${r.score}점`,
                body: `${detail.trait}\n\n직업 적성: ${detail.career}\n\n생(生)의 관계: ${detail.gen}`,
              })}
            >
              <View style={styles.elementLabelCol}>
                <Text style={[styles.elementKanji, { color: ELEM_COLOR[r.key] }]}>{r.key}</Text>
                <Text style={[styles.elementName, { color: ELEM_COLOR[r.key] }]}>{ELEM_EN[r.key]}</Text>
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
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setSectionInfo(SECTION_INFO.tenGods)} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>{labels.tenGods}</Text>
        <Text style={styles.sectionDeco}>十神 ⓘ</Text>
      </TouchableOpacity>
      <View style={styles.table}>
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
          const ssDesc = p.isDay
            ? STEM_DESC[p.stem] ?? p.stem
            : p.shiShin ? SHISHIN_DESC[p.shiShin] : null;
          const ssTitle = p.isDay
            ? `${labels.dayMaster} — ${p.stem}`
            : `${p.label}(${p.stem}) — ${p.shiShin}`;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.tableRow, p.isDay && styles.tableRowDay]}
              activeOpacity={0.7}
              onPress={() => ssDesc && setSectionInfo({ title: ssTitle, body: ssDesc })}
            >
              <Text style={[styles.cell, styles.cellText, p.isDay && { color: T.semantic.gold }]}>
                {p.label}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[stemEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.stem}
              </Text>
              <Text style={[styles.cell, styles.cellWide, styles.cellText, p.isDay && { color: T.semantic.gold, fontWeight: '700' }]}>
                {p.isDay ? labels.dayMaster : (p.shiShin ?? '')}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: 20, fontWeight: '700', textAlign: 'center' }]}>
                {p.branch}
              </Text>
              <Text style={[styles.cell, { color: ELEM_COLOR[branchEl], fontSize: T.fontSize.xs, textAlign: 'center' }]}>
                {ELEM_EN[branchEl]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 대운 Timeline ── */}
      {daewoon.length > 0 && (
        <>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setSectionInfo(SECTION_INFO.luckCycle)} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{labels.luckCycle}</Text>
            <Text style={styles.sectionDeco}>大運 ⓘ</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daewoonScroll}
          >
            {daewoon.map((dw, i) => {
              const isCurrent = i === currentDwIdx;
              const dwStemEl = STEM_ELEMENT[dw.pillar.stem];
              const dwBranchEl = BRANCH_ELEMENT[dw.pillar.branch];
              const dwColor = ELEM_COLOR[dw.element] ?? T.primary.DEFAULT;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.daewoonCard,
                    { borderColor: isCurrent ? T.semantic.gold : T.border.default },
                    isCurrent && { backgroundColor: T.semantic.gold + '0d' },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSectionInfo({
                    title: `${dw.pillar.stem}${dw.pillar.branch} 대운 (${dw.startAge}–${dw.startAge + 9}${labels.ageSuffix})${isCurrent ? ' ← 현재' : ''}`,
                    body: `천간 ${dw.pillar.stem} — ${STEM_DESC[dw.pillar.stem] ?? ''}\n\n지지 ${dw.pillar.branch} — ${BRANCH_DESC[dw.pillar.branch] ?? ''}\n\n대운 오행: ${ELEM_EN[dw.element] ?? dw.element}\n${ELEM_DETAIL[dw.element]?.trait ?? ''}`,
                  })}
                >
                  {/* Element accent top bar */}
                  <View style={[styles.dwAccentBar, { backgroundColor: dwColor }]} />

                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                  <Text style={[styles.dwAge, isCurrent && { color: T.semantic.gold }]}>
                    {dw.startAge}–{dw.startAge + 9}
                  </Text>
                  <Text style={[styles.dwAgeSuffix, isCurrent && { color: T.semantic.gold + '88' }]}>
                    {labels.ageSuffix}
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

    {/* ── Pillar Detail Modal ── */}
    <Modal
      visible={!!detailChar}
      transparent
      animationType="slide"
      onRequestClose={() => setDetailChar(null)}
    >
      <TouchableOpacity
        style={pdStyles.overlay}
        activeOpacity={1}
        onPress={() => setDetailChar(null)}
      >
        <View style={pdStyles.sheet}>
          <View style={pdStyles.handle} />
          <Text style={pdStyles.char}>{detailChar}</Text>
          <Text style={pdStyles.desc}>{detailText}</Text>
          <TouchableOpacity style={pdStyles.closeBtn} onPress={() => setDetailChar(null)}>
            <Text style={pdStyles.closeTxt}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

    {/* ── Section Info Modal ── */}
    <Modal
      visible={!!sectionInfo}
      transparent
      animationType="slide"
      onRequestClose={() => setSectionInfo(null)}
    >
      <TouchableOpacity
        style={pdStyles.overlay}
        activeOpacity={1}
        onPress={() => setSectionInfo(null)}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={pdStyles.sheet}>
            <View style={pdStyles.handle} />
            <Text style={[pdStyles.char, { fontSize: 18, marginBottom: 12 }]}>{sectionInfo?.title}</Text>
            <ScrollView style={pdStyles.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={[pdStyles.desc, { textAlign: 'left' }]}>{sectionInfo?.body}</Text>
            </ScrollView>
            <TouchableOpacity style={pdStyles.closeBtn} onPress={() => setSectionInfo(null)}>
              <Text style={pdStyles.closeTxt}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
    </>
  );
}

const pdStyles = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:     { backgroundColor: '#1a0a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, alignItems: 'center', maxHeight: '80%' },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: '#4a3568', marginBottom: 20 },
  char:      { fontSize: 52, color: '#a78bfa', marginBottom: 12 },
  bodyScroll:{ width: '100%', maxHeight: 320 },
  desc:      { fontSize: 15, color: '#c4b5fd', lineHeight: 24, textAlign: 'center' },
  closeBtn:  { marginTop: 24, paddingHorizontal: 32, paddingVertical: 10, borderRadius: 20, backgroundColor: '#2d1854' },
  closeTxt:  { color: '#a78bfa', fontWeight: '600' },
});

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
