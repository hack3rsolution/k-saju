/**
 * entitlementStore — tracks RevenueCat subscription and addon entitlements.
 *
 * Populated by syncEntitlements() after RC is initialised (see src/lib/purchases.ts).
 * All screens that gate premium features read from this store.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FREEMIUM CONVERSION STRATEGY (v2.2)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FREE tier — hook features (no paywall):
 *   • Daily Fortune       — unlimited, drives daily retention
 *   • Fortune Chat        — 1 message/day (hook for AI quality)
 *                           "1 free chat remaining today" indicator shown
 *                           Upgrade banner shown when limit reached
 *   • Compatibility       — basic 0-100 element score + one-line summary (local calc)
 *                           "See why — Unlock full report $4.99" CTA below score
 *   • Life Journal events — unlimited recording (unlimited is the hook)
 *                           AI Pattern Analysis gated behind Premium
 *   • Timing Advisor      — 1 analysis/month (enforced via useFreemiumLimits)
 *                           "Next free use in X days" shown when limit reached
 *
 * PREMIUM gate — key conversion levers:
 *   • Weekly Fortune      — preview: first sentence visible + blur overlay
 *                           "Unlock full access — $9.99/month" banner
 *   • Monthly Fortune     — premium only
 *   • Annual Fortune      — premium only
 *   • 大運 (10yr cycle)   — premium only
 *   • Fortune Chat        — unlimited (>1/day)
 *   • Timing Advisor      — unlimited (>1/month)
 *   • Journal AI Analysis — premium only
 *
 * ADDON gates (one-time IAP):
 *   • deep_compatibility  — Full AI Compatibility Report ($4.99)
 *   • career_wealth       — Career & Wealth Report ($4.99)
 *   • daewoon_pdf         — Full 大運 PDF Export ($6.99)
 *   • name_analysis       — Name Analysis 작명 ($9.99)
 *   • timing_advisor      — Timing Advisor unlimited upgrade ($2.99)
 *
 * DEV_BYPASS:
 *   Set EXPO_PUBLIC_ENABLE_DEV_BYPASS=true to skip all gates in dev builds.
 *   Defined in paywall.tsx and useFreemiumLimits.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { create } from 'zustand';

export interface EntitlementAddons {
  deepCompatibility: boolean;
  careerWealth: boolean;
  daewoonPdf: boolean;
  nameAnalysis: boolean;
  timingAdvisor: boolean;
}

const DEFAULT_ADDONS: EntitlementAddons = {
  deepCompatibility: false,
  careerWealth: false,
  daewoonPdf: false,
  nameAnalysis: false,
  timingAdvisor: false,
};

interface EntitlementState {
  isPremium: boolean;
  addons: EntitlementAddons;
  /** true while the initial RC customerInfo fetch is in flight */
  isLoading: boolean;
  setEntitlements: (isPremium: boolean, addons: EntitlementAddons) => void;
  setLoading: (loading: boolean) => void;
  /** Call on sign-out to clear cached entitlements */
  reset: () => void;
}

export const useEntitlementStore = create<EntitlementState>((set) => ({
  isPremium: false,
  addons: DEFAULT_ADDONS,
  isLoading: false,

  setEntitlements: (isPremium, addons) =>
    set({ isPremium, addons, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ isPremium: false, addons: DEFAULT_ADDONS, isLoading: false }),
}));
