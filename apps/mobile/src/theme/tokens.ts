/**
 * K-Saju Design Tokens — Issue #31
 *
 * 오방색(五方色) 현대적 재해석 컬러 시스템
 * Primary: #7c3aed (자주빛 퍼플)
 * 6개 문화권별 액센트 컬러 + 다크모드 토큰
 */
import type { FiveElement, CulturalFrame } from '@k-saju/saju-engine';

// ── Primary ───────────────────────────────────────────────────────────────────

export const primary = {
  DEFAULT: '#7c3aed',
  light: '#a78bfa',
  lighter: '#c4b5fd',
  dark: '#5b21b6',
  muted: '#7c3aed22',
  subtle: '#7c3aed44',
} as const;

// ── 오방색 (五方色) — 한국 전통 오방 배색의 현대적 재해석 ─────────────────────
//
//  청(靑) East   · 木 Wood   → Teal-Cyan  (고요함, 생장)
//  적(赤) South  · 火 Fire   → Coral-Rose (열정, 양기)
//  황(黃) Center · 土 Earth  → Amber-Gold (안정, 중심)
//  백(白) West   · 金 Metal  → Silver     (청결, 결단)
//  흑(黑) North  · 水 Water  → Deep Navy  (지혜, 음기)
//

export const obang = {
  cheong: '#06b6d4', // 청(靑) — East · Wood — Teal
  jeok:   '#f43f5e', // 적(赤) — South · Fire — Coral Rose
  hwang:  '#d97706', // 황(黃) — Center · Earth — Amber
  baek:   '#94a3b8', // 백(白) — West · Metal — Silver Slate
  heuk:   '#1e293b', // 흑(黑) — North · Water — Deep Navy
} as const;

// ── Five Elements palette ─────────────────────────────────────────────────────

export const element: Record<FiveElement, string> = {
  木: '#22c55e', // Wood — Emerald Green
  火: '#ef4444', // Fire — Vivid Red
  土: '#eab308', // Earth — Sunflower Yellow
  金: '#94a3b8', // Metal — Silver
  水: '#3b82f6', // Water — Sapphire Blue
};

export const elementGlow: Record<FiveElement, string> = {
  木: '#22c55e44',
  火: '#ef444444',
  土: '#eab30844',
  金: '#94a3b844',
  水: '#3b82f644',
};

// ── 6 Cultural Frame Accent Colors ────────────────────────────────────────────

export const frameAccent: Record<CulturalFrame, string> = {
  kr: '#7c3aed', // 자주빛 퍼플 — Korean
  cn: '#dc2626', // 황금 레드 — Chinese (BaZi precision)
  jp: '#e11d48', // 단풍 레드 — Japanese
  en: '#0ea5e9', // 미드나잇 블루 — Western/MBTI
  es: '#f59e0b', // 선셋 오렌지 — LATAM passion
  in: '#10b981', // 강가 그린 — South Asian karma
};

export const frameHighlight: Record<CulturalFrame, string> = {
  kr: '#c4b5fd', // light purple — complement to 자주빛
  cn: '#fca5a5', // light red — complement to 황금 레드
  jp: '#fda4af', // light rose — complement to 단풍 레드
  en: '#7dd3fc', // light sky blue — complement to 미드나잇 블루
  es: '#fcd34d', // light amber — complement to 선셋 오렌지
  in: '#6ee7b7', // light green — complement to 강가 그린
};

export const frameDecoChar: Record<CulturalFrame, string> = {
  kr: '命',
  cn: '八',
  jp: '運',
  en: '✦',
  es: '★',
  in: 'ॐ',
};

// ── Dark-mode background hierarchy ────────────────────────────────────────────

export const bg = {
  base:     '#0d0016', // Deepest — below cards
  surface:  '#1a0a2e', // Main screen background
  card:     '#2d1854', // Default card
  cardAlt:  '#231244', // Alternate card (subtle variety)
  elevated: '#3a1e6a', // Pressed / selected state
  overlay:  '#1e1040', // Modal overlay surface
  input:    '#1e0a38', // Input field background
} as const;

// ── Text ──────────────────────────────────────────────────────────────────────

export const text = {
  primary:  '#ffffff',
  secondary: '#e9d5ff',
  muted:    '#b8a9d9',
  faint:    '#9d8fbe',
  disabled: '#6b5b8f',
  caption:  '#5a4d7a',
  inverse:  '#0d0016',
} as const;

// ── Border ────────────────────────────────────────────────────────────────────

export const border = {
  subtle:   '#2d185422',
  default:  '#3d2471',
  emphasis: '#7c3aed',
  gold:     '#ffd700',
} as const;

// ── Spacing (8pt grid) ────────────────────────────────────────────────────────

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  '2xl': 28,
  full:  9999,
} as const;

// ── Shadow (Purple glow system) ───────────────────────────────────────────────

export const shadow = {
  sm: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  lg: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  xl: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
} as const;

// ── Typography scale ──────────────────────────────────────────────────────────

export const fontSize = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

// ── Named semantic colors ─────────────────────────────────────────────────────

export const semantic = {
  success: '#22c55e',
  warning: '#eab308',
  error:   '#ef4444',
  info:    '#3b82f6',
  gold:    '#ffd700',
  premium: '#ffd700',
} as const;

// ── Re-export as single T object ──────────────────────────────────────────────

export const T = {
  primary,
  obang,
  element,
  elementGlow,
  frameAccent,
  frameHighlight,
  frameDecoChar,
  bg,
  text,
  border,
  spacing,
  radius,
  shadow,
  fontSize,
  semantic,
} as const;

export default T;
