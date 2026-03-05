/**
 * PillarDetailModal — 사주 기둥 상세 설명
 *
 * 천간(10) + 지지(12) 설명을 보여주는 바텀시트 스타일 모달.
 * 연주 / 월주 / 일주 / 시주 중 하나를 탭하면 표시된다.
 */
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme/tokens';
import type { Stem, Branch } from '@k-saju/saju-engine';

// ── Stem descriptions (천간 10개) ─────────────────────────────────────────────

const STEM_INFO: Record<Stem, { element: string; polarity: string; image: string; personality: string; strength: string; caution: string }> = {
  甲: {
    element: '木 (나무)',
    polarity: '양(陽)',
    image: '큰 나무 · 대들보 · 봄의 새싹',
    personality: '진취적이고 리더십이 강하다. 올곧은 신념과 추진력을 지니며, 새로운 것을 시작하는 데 두려움이 없다.',
    strength: '개척정신, 창의력, 강한 의지력',
    caution: '고집이 세고 타협을 어려워할 수 있다.',
  },
  乙: {
    element: '木 (나무)',
    polarity: '음(陰)',
    image: '풀 · 덩굴 · 꽃',
    personality: '유연하고 적응력이 뛰어나다. 부드러운 방식으로 목표를 이루며, 협력과 조화를 중시한다.',
    strength: '사교성, 친화력, 뛰어난 적응력',
    caution: '우유부단해 보일 수 있고, 의존심이 생길 수 있다.',
  },
  丙: {
    element: '火 (불)',
    polarity: '양(陽)',
    image: '태양 · 장작불',
    personality: '밝고 활동적이며 카리스마가 넘친다. 주변에 따뜻한 에너지를 전파하며, 낙천적인 성격이다.',
    strength: '열정, 표현력, 리더십',
    caution: '성급함과 감정 기복에 주의가 필요하다.',
  },
  丁: {
    element: '火 (불)',
    polarity: '음(陰)',
    image: '촛불 · 별빛 · 용광로',
    personality: '섬세하고 따뜻하며 직관이 뛰어나다. 예술적 감각이 풍부하고 감정이입 능력이 탁월하다.',
    strength: '세심함, 통찰력, 예술적 감수성',
    caution: '예민해서 상처를 잘 받을 수 있다.',
  },
  戊: {
    element: '土 (흙)',
    polarity: '양(陽)',
    image: '높은 산 · 대지 · 성벽',
    personality: '안정적이고 포용력이 넓다. 묵직한 신뢰감을 주며, 어떤 상황에서도 중심을 잡는다.',
    strength: '신뢰성, 인내력, 포용력',
    caution: '변화에 보수적이고 고집스러울 수 있다.',
  },
  己: {
    element: '土 (흙)',
    polarity: '음(陰)',
    image: '논밭 · 모래 · 황토',
    personality: '세심하고 배려심이 깊다. 실질적인 문제를 꼼꼼히 처리하며, 주변 사람들을 보살핀다.',
    strength: '세밀함, 현실 감각, 배려심',
    caution: '지나친 걱정과 소심함으로 기회를 놓칠 수 있다.',
  },
  庚: {
    element: '金 (금속)',
    polarity: '양(陽)',
    image: '바위 · 검 · 도끼',
    personality: '강직하고 원칙적이다. 정의감이 강하며, 결단력 있게 일을 처리한다.',
    strength: '결단력, 정의감, 추진력',
    caution: '딱딱하고 날카로워 보여 인간관계에서 마찰이 생길 수 있다.',
  },
  辛: {
    element: '金 (금속)',
    polarity: '음(陰)',
    image: '보석 · 금은 · 작은 칼',
    personality: '예리하고 완벽주의 성향이 있다. 섬세한 미적 감각과 높은 기준을 유지한다.',
    strength: '정밀함, 미적 감각, 지성',
    caution: '완벽주의로 인한 스트레스와 까다로운 성격에 주의.',
  },
  壬: {
    element: '水 (물)',
    polarity: '양(陽)',
    image: '큰 강 · 바다 · 호수',
    personality: '지혜롭고 자유로우며 포부가 크다. 상황을 유연하게 읽으며, 넓은 시야로 세상을 바라본다.',
    strength: '지혜, 포용력, 유연성',
    caution: '방향 없이 흘러가 목표를 잃을 수 있다.',
  },
  癸: {
    element: '水 (물)',
    polarity: '음(陰)',
    image: '빗물 · 구름 · 안개',
    personality: '직관이 뛰어나고 감수성이 풍부하다. 보이지 않는 것을 느끼는 능력이 있으며, 상상력이 풍부하다.',
    strength: '직관력, 감수성, 창의성',
    caution: '현실감각이 부족해질 수 있고, 비밀주의적 성향이 있다.',
  },
};

// ── Branch descriptions (지지 12개) ───────────────────────────────────────────

const BRANCH_INFO: Record<Branch, { animal: string; element: string; month: string; personality: string }> = {
  子: { animal: '쥐 🐭', element: '水', month: '11월', personality: '영리하고 적응력이 강하다. 재치 있고 기회를 잘 포착한다.' },
  丑: { animal: '소 🐂', element: '土', month: '12월', personality: '인내력이 강하고 성실하다. 묵묵히 자신의 길을 걷는다.' },
  寅: { animal: '호랑이 🐯', element: '木', month: '1월', personality: '용감하고 결단력이 있다. 리더십과 독립심이 강하다.' },
  卯: { animal: '토끼 🐰', element: '木', month: '2월', personality: '민첩하고 영민하다. 예술적 감각이 뛰어나고 평화를 사랑한다.' },
  辰: { animal: '용 🐉', element: '土', month: '3월', personality: '강력하고 카리스마가 있다. 이상이 높고 성취욕이 강하다.' },
  巳: { animal: '뱀 🐍', element: '火', month: '4월', personality: '지혜롭고 직관적이다. 신중하게 상황을 관찰하며 깊이 생각한다.' },
  午: { animal: '말 🐴', element: '火', month: '5월', personality: '활동적이고 열정적이다. 자유를 사랑하며 사교적이다.' },
  未: { animal: '양 🐑', element: '土', month: '6월', personality: '온화하고 예술적이다. 감성이 풍부하고 사람들을 배려한다.' },
  申: { animal: '원숭이 🐒', element: '金', month: '7월', personality: '영리하고 재치 있다. 다재다능하고 변화에 능숙하다.' },
  酉: { animal: '닭 🐓', element: '金', month: '8월', personality: '정확하고 완벽주의적이다. 꼼꼼하고 체계적으로 일을 처리한다.' },
  戌: { animal: '개 🐕', element: '土', month: '9월', personality: '충직하고 정의감이 강하다. 믿을 수 있는 친구이자 동반자다.' },
  亥: { animal: '돼지 🐗', element: '水', month: '10월', personality: '복덕하고 포용적이다. 성실하고 너그러우며 풍요로운 기운을 품는다.' },
};

// ── Pillar label ──────────────────────────────────────────────────────────────

const PILLAR_LABELS: Record<string, string> = {
  year:  '연주(年柱)',
  month: '월주(月柱)',
  day:   '일주(日柱)',
  hour:  '시주(時柱)',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PillarDetailModalProps {
  visible: boolean;
  pillarKey: 'year' | 'month' | 'day' | 'hour' | null;
  stem: Stem | null;
  branch: Branch | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PillarDetailModal({
  visible,
  pillarKey,
  stem,
  branch,
  onClose,
}: PillarDetailModalProps) {
  if (!pillarKey || !stem) return null;

  const stemInfo   = STEM_INFO[stem];
  const branchInfo = branch ? BRANCH_INFO[branch] : null;
  const pillarLabel = PILLAR_LABELS[pillarKey] ?? '기둥';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.pillarLabel}>{pillarLabel}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Combined pillar display */}
          <View style={styles.pillarDisplay}>
            <Text style={styles.stemChar}>{stem}</Text>
            {branch && <Text style={styles.branchChar}>{branch}</Text>}
          </View>

          {/* ── Heavenly Stem section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTag}>천간 (天干)</Text>
            <Text style={styles.charTitle}>{stem}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>오행</Text>
                <Text style={styles.metaValue}>{stemInfo.element}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>음양</Text>
                <Text style={styles.metaValue}>{stemInfo.polarity}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>🌿 상징</Text>
              <Text style={styles.infoText}>{stemInfo.image}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>✨ 성격</Text>
              <Text style={styles.infoText}>{stemInfo.personality}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>💪 강점</Text>
              <Text style={styles.infoText}>{stemInfo.strength}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>⚠️ 주의</Text>
              <Text style={styles.infoText}>{stemInfo.caution}</Text>
            </View>
          </View>

          {/* ── Earthly Branch section ── */}
          {branchInfo && branch && (
            <View style={styles.section}>
              <Text style={styles.sectionTag}>지지 (地支)</Text>
              <Text style={styles.charTitle}>{branch}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>동물</Text>
                  <Text style={styles.metaValue}>{branchInfo.animal}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>오행</Text>
                  <Text style={styles.metaValue}>{branchInfo.element}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>절기</Text>
                  <Text style={styles.metaValue}>{branchInfo.month}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>✨ 성향</Text>
                <Text style={styles.infoText}>{branchInfo.personality}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: T.bg.elevated,
    borderTopLeftRadius: T.radius['2xl'],
    borderTopRightRadius: T.radius['2xl'],
    paddingHorizontal: T.spacing[6],
    paddingBottom: T.spacing[4],
    maxHeight: '82%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: T.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: T.spacing[3],
    marginBottom: T.spacing[4],
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing[4],
  },
  pillarLabel: {
    fontSize: T.fontSize.md,
    fontWeight: '700',
    color: T.text.faint,
  },
  closeBtn: {
    padding: T.spacing[2],
  },
  closeBtnText: {
    fontSize: T.fontSize.md,
    color: T.text.faint,
  },

  pillarDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.spacing[4],
    marginBottom: T.spacing[6],
  },
  stemChar: {
    fontSize: 64,
    fontWeight: '900',
    color: T.semantic.gold,
    lineHeight: 72,
  },
  branchChar: {
    fontSize: 64,
    fontWeight: '800',
    color: T.primary.lighter,
    lineHeight: 72,
    opacity: 0.8,
  },

  section: {
    marginBottom: T.spacing[6],
    backgroundColor: T.bg.card,
    borderRadius: T.radius.lg,
    padding: T.spacing[5],
    borderWidth: 1,
    borderColor: T.border.default,
  },
  sectionTag: {
    fontSize: T.fontSize.xs,
    color: T.primary.light,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: T.spacing[2],
  },
  charTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: T.text.primary,
    marginBottom: T.spacing[4],
  },

  metaRow: {
    flexDirection: 'row',
    gap: T.spacing[2],
    marginBottom: T.spacing[4],
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: T.bg.input,
    borderRadius: T.radius.sm,
    paddingHorizontal: T.spacing[3],
    paddingVertical: T.spacing[2],
  },
  metaLabel: {
    fontSize: 9,
    color: T.text.disabled,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: T.fontSize.sm,
    color: T.text.secondary,
    fontWeight: '600',
  },

  infoBox: {
    marginBottom: T.spacing[3],
  },
  infoLabel: {
    fontSize: T.fontSize.xs,
    color: T.text.faint,
    fontWeight: '600',
    marginBottom: 3,
  },
  infoText: {
    fontSize: T.fontSize.sm,
    color: T.text.secondary,
    lineHeight: 20,
  },
});
