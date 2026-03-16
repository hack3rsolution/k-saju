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
  /** Bundle: timing + compatibility + career */
  starterPack: boolean;
  /** Bundle: all 5 addons */
  fullPack: boolean;
}

const DEFAULT_ADDONS: EntitlementAddons = {
  deepCompatibility: false,
  careerWealth: false,
  daewoonPdf: false,
  nameAnalysis: false,
  timingAdvisor: false,
  starterPack: false,
  fullPack: false,
};

// Dev bypass: when EXPO_PUBLIC_ENABLE_DEV_BYPASS=true, all premium features are unlocked from the start
const DEV_PREMIUM = process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';
const ALL_ADDONS: EntitlementAddons = {
  deepCompatibility: true,
  careerWealth: true,
  daewoonPdf: true,
  nameAnalysis: true,
  timingAdvisor: true,
  starterPack: true,
  fullPack: true,
};

// Items unlocked by Starter Pack
const STARTER_PACK_ITEMS: (keyof EntitlementAddons)[] = [
  'deepCompatibility', 'careerWealth', 'timingAdvisor',
];

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
  isPremium: DEV_PREMIUM,
  addons: DEV_PREMIUM ? ALL_ADDONS : DEFAULT_ADDONS,
  isLoading: false,

  setEntitlements: (isPremium, addons) =>
    set({ isPremium: DEV_PREMIUM || isPremium, addons: DEV_PREMIUM ? ALL_ADDONS : addons, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ isPremium: DEV_PREMIUM, addons: DEV_PREMIUM ? ALL_ADDONS : DEFAULT_ADDONS, isLoading: false }),
}));

/**
 * Belt-and-suspenders hook: always returns true when DEV_BYPASS is set,
 * even if the store hasn't hydrated yet.
 */
export function useIsPremium(): boolean {
  const storeIsPremium = useEntitlementStore((s) => s.isPremium);
  return DEV_PREMIUM || storeIsPremium;
}

export function useHasAddon(addon: keyof EntitlementAddons): boolean {
  const addons = useEntitlementStore((s) => s.addons);
  if (DEV_PREMIUM) return true;
  if (addons[addon]) return true;
  if (addons.fullPack) return true;
  if (addons.starterPack && STARTER_PACK_ITEMS.includes(addon)) return true;
  return false;
}
