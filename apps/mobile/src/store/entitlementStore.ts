/**
 * entitlementStore — tracks RevenueCat subscription and addon entitlements.
 *
 * Populated by syncEntitlements() after RC is initialised (see src/lib/purchases.ts).
 * All screens that gate premium features read from this store.
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
