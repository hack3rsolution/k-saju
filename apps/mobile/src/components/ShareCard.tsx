/**
 * ShareCard — capturable image card for viral sharing.
 *
 * Fixed 320 pt wide so captureRef always renders at a consistent size.
 * Pass a `forwardRef`-compatible ref (View) to captureRef() from view-shot.
 *
 * 6 cultural frame themes, each with its own background, accent & highlight colours.
 */
import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CulturalFrame, FiveElement } from '@k-saju/saju-engine';

// ── Theme map ─────────────────────────────────────────────────────────────────

interface Theme {
  bg: string;
  panel: string;       // inner pillar panel
  accent: string;      // top bar + badges
  highlight: string;   // golden accent
  label: string;       // frame display name
  deco: string;        // large background decoration character(s)
}

const THEMES: Record<CulturalFrame, Theme> = {
  kr: {
    bg: '#12001f',
    panel: '#2a0040',
    accent: '#c8102e',
    highlight: '#ffd700',
    label: '사주팔자',
    deco: '命',
  },
  cn: {
    bg: '#1a0000',
    panel: '#330000',
    accent: '#cc0000',
    highlight: '#ffcc00',
    label: '四柱八字 · BaZi',
    deco: '八',
  },
  jp: {
    bg: '#0a0a18',
    panel: '#1a1a38',
    accent: '#bc002d',
    highlight: '#e8d5a3',
    label: '四柱推命',
    deco: '運',
  },
  en: {
    bg: '#0a061e',
    panel: '#1a1040',
    accent: '#7c3aed',
    highlight: '#60a5fa',
    label: 'Cosmic Blueprint',
    deco: '✦',
  },
  es: {
    bg: '#180800',
    panel: '#2e1200',
    accent: '#ea580c',
    highlight: '#fbbf24',
    label: 'Destino Cósmico',
    deco: '★',
  },
  in: {
    bg: '#1a0500',
    panel: '#2e0e00',
    accent: '#f97316',
    highlight: '#fcd34d',
    label: 'Vedic Fusion',
    deco: 'ॐ',
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

const ELEMENT_COLOR: Record<FiveElement, string> = {
  木: '#22c55e',
  火: '#ef4444',
  土: '#eab308',
  金: '#94a3b8',
  水: '#3b82f6',
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ShareCardProps {
  frame: CulturalFrame;
  /** User's day pillar stem (일간) e.g. 丙 */
  dayStem: string;
  /** User's day pillar branch e.g. 午 */
  dayBranch: string;
  /** Five-element of the day stem */
  dayElement: FiveElement;
  /** Today's 年月日 간지 string */
  ganji: string;
  /** Fortune summary text (1-2 sentences) */
  summary: string;
}

// ── Component (forwardRef so captureRef works) ────────────────────────────────

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { frame, dayStem, dayBranch, dayElement, ganji, summary },
  ref,
) {
  const theme = THEMES[frame] ?? THEMES.en;
  const elemColor = ELEMENT_COLOR[dayElement] ?? '#7c3aed';

  // Trim summary to ≤120 chars so it fits comfortably
  const displaySummary =
    summary.length > 120 ? summary.slice(0, 117) + '…' : summary;

  return (
    <View ref={ref} style={[styles.card, { backgroundColor: theme.bg }]}>
      {/* Decorative watermark glyph */}
      <Text style={[styles.decoGlyph, { color: theme.accent }]}>{theme.deco}</Text>

      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.appName}>K-Saju</Text>
        <View style={[styles.frameBadge, { backgroundColor: theme.accent + '33', borderColor: theme.accent }]}>
          <Text style={[styles.frameBadgeText, { color: theme.highlight }]}>{theme.label}</Text>
        </View>
      </View>

      {/* Day pillar */}
      <View style={[styles.pillarPanel, { backgroundColor: theme.panel }]}>
        <Text style={[styles.pillarStem, { color: elemColor }]}>{dayStem}</Text>
        <Text style={[styles.pillarBranch, { color: elemColor + 'cc' }]}>{dayBranch}</Text>
        <View style={[styles.elemBadge, { backgroundColor: elemColor + '22' }]}>
          <Text style={[styles.elemText, { color: elemColor }]}>{ELEMENT_LABEL[dayElement]}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.accent + '44' }]} />

      {/* Fortune label */}
      <Text style={[styles.fortuneLabel, { color: theme.highlight }]}>Today's Fortune</Text>

      {/* Summary */}
      <Text style={styles.summary}>{displaySummary}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.ganjiText}>{ganji}</Text>
        <Text style={[styles.watermark, { color: theme.accent + '99' }]}>
          K-Saju Global · k-saju.app
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
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  // Background decoration
  decoGlyph: {
    position: 'absolute',
    fontSize: 200,
    opacity: 0.05,
    fontWeight: '900',
    right: -20,
    top: 40,
    zIndex: 0,
  },
  // Top accent bar
  accentBar: { width: '100%', height: 5 },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    zIndex: 1,
  },
  appName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  frameBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  frameBadgeText: { fontSize: 10, fontWeight: '700' },
  // Day pillar panel
  pillarPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  pillarStem: { fontSize: 72, fontWeight: '700', lineHeight: 80 },
  pillarBranch: { fontSize: 56, fontWeight: '600', lineHeight: 64, marginTop: -4 },
  elemBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  elemText: { fontSize: 12, fontWeight: '700' },
  // Divider
  divider: { height: 1, marginHorizontal: 20, marginBottom: 16, zIndex: 1 },
  // Fortune
  fortuneLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
    zIndex: 1,
  },
  summary: {
    color: '#e9d5ff',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1,
  },
  // Footer
  footer: { paddingHorizontal: 20, zIndex: 1 },
  ganjiText: { color: '#9d8fbe', fontSize: 12, marginBottom: 6 },
  watermark: { fontSize: 10, fontWeight: '600' },
});
