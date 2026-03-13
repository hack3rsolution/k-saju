/**
 * ShareCard — capturable image card for viral sharing (issue #8 / design-system #31)
 *
 * Fixed 320 pt wide — consistent captureRef size.
 * SNS-optimized: square-friendly ratio, bold typography, cultural theming.
 * 6 cultural frame themes with 오방색-inspired accent system.
 */
import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CulturalFrame, FiveElement } from '@k-saju/saju-engine';
import { T } from '../theme/tokens';

// ── Theme map ─────────────────────────────────────────────────────────────────

interface Theme {
  bg: string;
  panel: string;
  accent: string;
  highlight: string;
  label: string;
  deco: string;
  decoSecondary: string;
}

const THEMES: Record<CulturalFrame, Theme> = {
  kr: {
    bg: '#120020',
    panel: '#2a0040',
    accent: T.frameAccent.kr,
    highlight: T.frameHighlight.kr,
    label: '사주팔자',
    deco: '命',
    decoSecondary: '運',
  },
  cn: {
    bg: '#1a0000',
    panel: '#2e0800',
    accent: T.frameAccent.cn,
    highlight: T.frameHighlight.cn,
    label: '四柱八字 · BaZi',
    deco: '八',
    decoSecondary: '命',
  },
  jp: {
    bg: '#0a0a18',
    panel: '#1a1a38',
    accent: T.frameAccent.jp,
    highlight: T.frameHighlight.jp,
    label: '四柱推命',
    deco: '運',
    decoSecondary: '命',
  },
  en: {
    bg: '#030d1a',    // deep midnight blue
    panel: '#071e38', // dark navy panel
    accent: T.frameAccent.en,
    highlight: T.frameHighlight.en,
    label: 'Cosmic Blueprint',
    deco: '✦',
    decoSecondary: '命',
  },
  es: {
    bg: '#1a0e00',
    panel: '#2e1c00',
    accent: T.frameAccent.es,
    highlight: T.frameHighlight.es,
    label: 'Destino Cósmico',
    deco: '★',
    decoSecondary: '命',
  },
  in: {
    bg: '#011a0e',    // deep forest green
    panel: '#032e18', // dark green panel
    accent: T.frameAccent.in,
    highlight: T.frameHighlight.in,
    label: 'Vedic Fusion',
    deco: 'ॐ',
    decoSecondary: '命',
  },
};

// ── Element label map ─────────────────────────────────────────────────────────

const ELEMENT_LABEL: Record<FiveElement, string> = {
  木: 'Wood · 木',
  火: 'Fire · 火',
  土: 'Earth · 土',
  金: 'Metal · 金',
  水: 'Water · 水',
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ShareCardProps {
  frame: CulturalFrame;
  dayStem: string;
  dayBranch: string;
  dayElement: FiveElement;
  ganji: string;
  summary: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { frame, dayStem, dayBranch, dayElement, ganji, summary },
  ref,
) {
  const { t } = useTranslation('common');
  const theme = THEMES[frame] ?? THEMES.en;
  const elemColor = T.element[dayElement] ?? T.primary.DEFAULT;

  const displaySummary =
    summary.length > 110 ? summary.slice(0, 107) + '…' : summary;

  return (
    <View ref={ref} style={[styles.card, { backgroundColor: theme.bg }]}>

      {/* ── Background decoration glyphs ── */}
      <Text style={[styles.decoGlyphLarge, { color: theme.accent }]}>{theme.deco}</Text>
      <Text style={[styles.decoGlyphSmall, { color: theme.accent }]}>{theme.decoSecondary}</Text>

      {/* ── Top accent bar with mini lines ── */}
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]}>
        <View style={[styles.accentBarInner, { backgroundColor: theme.highlight + '66' }]} />
      </View>

      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appName}>K-Saju</Text>
          <Text style={[styles.appTagline, { color: theme.accent + 'cc' }]}>四柱命理</Text>
        </View>
        <View style={[styles.frameBadge, { backgroundColor: theme.accent + '28', borderColor: theme.accent + '66' }]}>
          <Text style={[styles.frameBadgeText, { color: theme.highlight }]}>{theme.label}</Text>
        </View>
      </View>

      {/* ── Pillar panel ── */}
      <View style={[styles.pillarPanel, { backgroundColor: theme.panel }]}>
        {/* Element indicator line */}
        <View style={[styles.pillarAccentLine, { backgroundColor: elemColor }]} />

        <View style={styles.pillarContent}>
          <View style={styles.pillarChars}>
            <Text style={[styles.pillarStem, { color: elemColor }]}>{dayStem}</Text>
            <View style={[styles.pillarStemDivider, { backgroundColor: elemColor + '44' }]} />
            <Text style={[styles.pillarBranch, { color: elemColor + 'cc' }]}>{dayBranch}</Text>
          </View>

          <View style={styles.pillarMeta}>
            <Text style={[styles.pillarMetaLabel, { color: T.text.faint }]}>일주 (Day Pillar)</Text>
            <View style={[styles.elemBadge, { backgroundColor: elemColor + '22', borderColor: elemColor + '55' }]}>
              <Text style={[styles.elemText, { color: elemColor }]}>{ELEMENT_LABEL[dayElement]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Decorative divider ── */}
      <View style={styles.sectionDivider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.accent + '33' }]} />
        <Text style={[styles.dividerGlyph, { color: theme.accent + '66' }]}>今日</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.accent + '33' }]} />
      </View>

      {/* ── Fortune section ── */}
      <Text style={[styles.fortuneLabel, { color: theme.highlight }]}>{t('fortuneChat.todaysFortune')}</Text>
      <Text style={styles.summary}>{displaySummary}</Text>

      {/* ── Footer ── */}
      <View style={[styles.footer, { borderTopColor: theme.accent + '22' }]}>
        <Text style={[styles.ganjiText, { color: theme.highlight + 'cc' }]}>{ganji}</Text>
        <Text style={[styles.watermark, { color: theme.accent + '88' }]}>
          K-Saju Global
        </Text>
      </View>
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: T.radius.xl,
    overflow: 'hidden',
    paddingBottom: 0,
  },

  // Background decoration
  decoGlyphLarge: {
    position: 'absolute',
    fontSize: 180,
    opacity: 0.06,
    fontWeight: '900',
    right: -16,
    top: 30,
    zIndex: 0,
  },
  decoGlyphSmall: {
    position: 'absolute',
    fontSize: 60,
    opacity: 0.04,
    fontWeight: '900',
    left: 16,
    bottom: 60,
    zIndex: 0,
  },

  // Top accent bar
  accentBar: { width: '100%', height: 5, position: 'relative' },
  accentBarInner: { position: 'absolute', top: 2, left: 0, right: 0, height: 1 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: T.spacing[5],
    paddingTop: T.spacing[5],
    paddingBottom: 6,
    zIndex: 1,
  },
  appName: { color: T.text.primary, fontSize: T.fontSize.md, fontWeight: '800', letterSpacing: 0.3 },
  appTagline: { fontSize: 9, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  frameBadge: {
    borderRadius: T.radius.sm, borderWidth: 1,
    paddingHorizontal: T.spacing[2], paddingVertical: 3,
  },
  frameBadgeText: { fontSize: T.fontSize.xs, fontWeight: '700' },

  // Pillar panel
  pillarPanel: {
    marginHorizontal: T.spacing[5],
    marginTop: T.spacing[4],
    marginBottom: T.spacing[5],
    borderRadius: T.radius.lg,
    overflow: 'hidden',
    zIndex: 1,
  },
  pillarAccentLine: { height: 2, width: '100%' },
  pillarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing[5],
    paddingVertical: T.spacing[5],
    gap: T.spacing[5],
  },
  pillarChars: { flexDirection: 'row', alignItems: 'center', gap: T.spacing[2] },
  pillarStem: { fontSize: 64, fontWeight: '800', lineHeight: 70 },
  pillarStemDivider: { width: 1, height: 52, marginTop: 4 },
  pillarBranch: { fontSize: 50, fontWeight: '700', lineHeight: 58 },
  pillarMeta: { flex: 1, justifyContent: 'center' },
  pillarMetaLabel: { fontSize: T.fontSize.xs, marginBottom: T.spacing[2], fontWeight: '500' },
  elemBadge: { borderRadius: T.radius.sm, paddingHorizontal: T.spacing[2], paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  elemText: { fontSize: T.fontSize.xs, fontWeight: '700' },

  // Decorative divider
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: T.spacing[5], gap: T.spacing[2], marginBottom: T.spacing[4],
    zIndex: 1,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerGlyph: { fontSize: T.fontSize.xs, fontWeight: '700' },

  // Fortune
  fortuneLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: T.spacing[5],
    marginBottom: T.spacing[2],
    zIndex: 1,
  },
  summary: {
    color: T.text.muted,
    fontSize: T.fontSize.sm,
    lineHeight: 21,
    paddingHorizontal: T.spacing[5],
    marginBottom: T.spacing[5],
    zIndex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: T.spacing[5], paddingVertical: T.spacing[4],
    borderTopWidth: 1, zIndex: 1,
  },
  ganjiText: { fontSize: T.fontSize.sm, fontWeight: '600' },
  watermark: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
