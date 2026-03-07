/**
 * PillarDetailModal — 사주 기둥 상세 설명
 *
 * 천간(10) + 지지(12) 설명을 보여주는 바텀시트 스타일 모달.
 * 연주 / 월주 / 일주 / 시주 중 하나를 탭하면 표시된다.
 */
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { T } from '../theme/tokens';
import type { Stem, Branch } from '@k-saju/saju-engine';
import { STEM_ELEMENT } from '@k-saju/saju-engine';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map FiveElement kanji → i18next common:elements key */
const FE_ENG: Record<string, string> = {
  '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water',
};

/** Stem polarity (for t('common:yang') / t('common:yin')) */
const STEM_POLARITY: Record<Stem, 'yang' | 'yin'> = {
  甲: 'yang', 乙: 'yin', 丙: 'yang', 丁: 'yin', 戊: 'yang',
  己: 'yin',  庚: 'yang', 辛: 'yin', 壬: 'yang', 癸: 'yin',
};

/** Branch element kanji (for display) */
const BRANCH_ELEMENT_KANJI: Record<Branch, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
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
  const { t } = useTranslation(['chart', 'common']);

  if (!pillarKey || !stem) return null;

  const stemEl = STEM_ELEMENT[stem];
  const elementLabel = `${stemEl} (${t(`common:elements.${FE_ENG[stemEl] ?? 'Wood'}`)})`;
  const polarityLabel = t(`common:${STEM_POLARITY[stem]}`);

  const pillarLabel = t(`chart:pillarLabels.${pillarKey}`, t('chart:pillarLabels.default'));

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
            <Text style={styles.sectionTag}>{t('chart:pillarDetail.heavenlyStem')}</Text>
            <Text style={styles.charTitle}>{stem}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>{t('chart:pillarDetail.fiveElement')}</Text>
                <Text style={styles.metaValue}>{elementLabel}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>{t('chart:pillarDetail.polarity')}</Text>
                <Text style={styles.metaValue}>{polarityLabel}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{t('chart:pillarDetail.symbolLabel')}</Text>
              <Text style={styles.infoText}>{t(`chart:stemDesc.${stem}.image`)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{t('chart:pillarDetail.personalityLabel')}</Text>
              <Text style={styles.infoText}>{t(`chart:stemDesc.${stem}.personality`)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{t('chart:pillarDetail.strengthLabel')}</Text>
              <Text style={styles.infoText}>{t(`chart:stemDesc.${stem}.strength`)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{t('chart:pillarDetail.cautionLabel')}</Text>
              <Text style={styles.infoText}>{t(`chart:stemDesc.${stem}.caution`)}</Text>
            </View>
          </View>

          {/* ── Earthly Branch section ── */}
          {branch && (
            <View style={styles.section}>
              <Text style={styles.sectionTag}>{t('chart:pillarDetail.earthlyBranch')}</Text>
              <Text style={styles.charTitle}>{branch}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>{t('chart:pillarDetail.animal')}</Text>
                  <Text style={styles.metaValue}>{t(`chart:branchDesc.${branch}.animal`)}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>{t('chart:pillarDetail.fiveElement')}</Text>
                  <Text style={styles.metaValue}>{BRANCH_ELEMENT_KANJI[branch]}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>{t('chart:pillarDetail.solarTerm')}</Text>
                  <Text style={styles.metaValue}>{t(`chart:branchDesc.${branch}.month`)}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>{t('chart:pillarDetail.tendencyLabel')}</Text>
                <Text style={styles.infoText}>{t(`chart:branchDesc.${branch}.personality`)}</Text>
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
