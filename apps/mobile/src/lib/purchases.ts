/**
 * purchases.ts — RevenueCat SDK wrapper.
 *
 * Env vars required (apps/mobile/.env):
 *   EXPO_PUBLIC_RC_API_KEY_IOS     — RevenueCat iOS public API key
 *   EXPO_PUBLIC_RC_API_KEY_ANDROID — RevenueCat Android public API key
 *
 * RevenueCat entitlement identifiers (configure in RC dashboard):
 *   premium          — subscription (monthly or annual)
 *   deep_compatibility, career_wealth, daewoon_pdf, name_analysis — addons
 */
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { useEntitlementStore } from '../store/entitlementStore';
import type { EntitlementAddons } from '../store/entitlementStore';

const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '';

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Call once after auth, passing the Supabase user ID so RC can link the
 * subscriber across devices.
 */
export function initializePurchases(userId?: string): void {
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) return; // skip when no API key is configured (e.g. development)

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId ?? null });
}

// ── Entitlement parsing ───────────────────────────────────────────────────────

function parseCustomerInfo(info: CustomerInfo): {
  isPremium: boolean;
  addons: EntitlementAddons;
} {
  const active = info.entitlements.active;
  return {
    isPremium: 'premium' in active,
    addons: {
      deepCompatibility: 'deep_compatibility' in active,
      careerWealth: 'career_wealth' in active,
      daewoonPdf: 'daewoon_pdf' in active,
      nameAnalysis: 'name_analysis' in active,
    },
  };
}

// ── Sync ──────────────────────────────────────────────────────────────────────

/** Fetch CustomerInfo from RC and push results to entitlementStore. */
export async function syncEntitlements(): Promise<void> {
  const { setEntitlements, setLoading } = useEntitlementStore.getState();
  setLoading(true);
  try {
    const info = await Purchases.getCustomerInfo();
    const { isPremium, addons } = parseCustomerInfo(info);
    setEntitlements(isPremium, addons);
  } catch {
    // Best-effort; leave loading=false so gates fall through to free tier
    setLoading(false);
  }
}

// ── Purchase ──────────────────────────────────────────────────────────────────

/** Purchase a package and update entitlements. Throws on user cancellation or error. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const { isPremium, addons } = parseCustomerInfo(customerInfo);
  useEntitlementStore.getState().setEntitlements(isPremium, addons);
  return customerInfo;
}

// ── Restore ───────────────────────────────────────────────────────────────────

/** Restore previous purchases and update entitlements. */
export async function restorePurchases(): Promise<CustomerInfo> {
  const customerInfo = await Purchases.restorePurchases();
  const { isPremium, addons } = parseCustomerInfo(customerInfo);
  useEntitlementStore.getState().setEntitlements(isPremium, addons);
  return customerInfo;
}

export type { PurchasesPackage };
