/**
 * paywall.tsx — Subscription + addon purchase modal.
 *
 * Fetches the current RevenueCat offering on mount and shows real package prices.
 * Falls back to display-only (no purchase) if RC isn't configured or offerings
 * fail to load.
 *
 * Entitlement gate mapping (RC dashboard):
 *   Offering "default"  → monthly + annual subscription packages
 *   Entitlement "premium" granted by both subscription products
 *   Addon entitlements: deep_compatibility, career_wealth, daewoon_pdf, name_analysis
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { purchasePackage, restorePurchases } from '../src/lib/purchases';
import { useEntitlementStore } from '../src/store/entitlementStore';

// ── Static plan metadata (labels, features) ───────────────────────────────────

const PLAN_META = {
  monthly: {
    name: 'Premium Monthly',
    fallbackPrice: '$8.99/mo',
    highlight: false,
    features: [
      'Unlimited daily fortune readings',
      'Monthly & annual luck cycles',
      '대운 (10-year cycle) analysis',
      'Compatibility reports',
      'All cultural frame styles',
    ],
  },
  annual: {
    name: 'Premium Annual',
    fallbackPrice: '$59.99/yr',
    highlight: true,
    badge: 'Best Value · Save 44%',
    features: [
      'Everything in Monthly',
      '2 add-on reports per year',
      'Priority AI readings',
      'Early access to new features',
    ],
  },
};

const ADDON_META: { key: string; name: string; fallbackPrice: string }[] = [
  { key: 'k_saju_compatibility', name: 'Deep Compatibility Report', fallbackPrice: '$4.99' },
  { key: 'k_saju_career',        name: 'Career & Wealth Report',    fallbackPrice: '$4.99' },
  { key: 'k_saju_daewoon_pdf',   name: 'Full 대운 Report (PDF)',    fallbackPrice: '$6.99' },
  { key: 'k_saju_name_analysis', name: 'Name Analysis (작명)',      fallbackPrice: '$9.99' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function packagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const isPremium = useEntitlementStore((s) => s.isPremium);

  // Fetch current offering on mount
  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        setOffering(offerings.current);
      } catch {
        // RC not configured or network error — fall back to display-only
      } finally {
        setOfferingLoading(false);
      }
    }
    fetchOfferings();
  }, []);

  // ── Find packages by type ──────────────────────────────────────────────────

  const monthlyPkg = offering?.availablePackages.find(
    (p) => p.packageType === PACKAGE_TYPE.MONTHLY,
  ) ?? null;

  const annualPkg = offering?.availablePackages.find(
    (p) => p.packageType === PACKAGE_TYPE.ANNUAL,
  ) ?? null;

  // Addons: look for packages whose productIdentifier contains the key
  function findAddonPkg(productKey: string): PurchasesPackage | null {
    return (
      offering?.availablePackages.find((p) =>
        p.product.identifier.includes(productKey),
      ) ?? null
    );
  }

  // ── Purchase handlers ──────────────────────────────────────────────────────

  async function handlePurchase(pkg: PurchasesPackage | null, label: string) {
    if (!pkg) {
      Alert.alert('Not Available', `${label} is not available right now. Please try again later.`);
      return;
    }
    setPurchasing(pkg.identifier);
    try {
      await purchasePackage(pkg);
      Alert.alert('Success!', 'You are now a Premium member. Enjoy unlimited readings!', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      // PurchasesError code 1 = user cancelled — don't show error
      if ((e as { userCancelled?: boolean })?.userCancelled) return;
      Alert.alert('Purchase Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const hasActive = Object.keys(info.entitlements.active).length > 0;
      Alert.alert(
        hasActive ? 'Purchases Restored' : 'Nothing to Restore',
        hasActive
          ? 'Your subscription has been restored.'
          : 'No previous purchases found for this account.',
      );
    } catch (e: unknown) {
      Alert.alert('Restore Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  // ── Sub-components ─────────────────────────────────────────────────────────

  function PlanCard({
    meta,
    pkg,
  }: {
    meta: typeof PLAN_META.monthly;
    pkg: PurchasesPackage | null;
  }) {
    const isBuying = purchasing === pkg?.identifier;
    const price = pkg ? packagePrice(pkg) : meta.fallbackPrice;
    const label = 'badge' in meta && meta.badge ? (meta as typeof PLAN_META.annual).badge : undefined;

    return (
      <View style={[styles.planCard, meta.highlight && styles.planCardHighlight]}>
        {label && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        )}
        {isPremium && (
          <View style={[styles.badge, { backgroundColor: '#16a34a' }]}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        )}
        <Text style={styles.planName}>{meta.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.planPrice}>{price}</Text>
        </View>
        {meta.features.map((f) => (
          <Text key={f} style={styles.feature}>✓  {f}</Text>
        ))}
        <TouchableOpacity
          style={[
            styles.planBtn,
            meta.highlight && styles.planBtnHighlight,
            (isBuying || isPremium) && styles.planBtnDisabled,
          ]}
          onPress={() => handlePurchase(pkg, meta.name)}
          disabled={isBuying || isPremium || purchasing !== null}
        >
          {isBuying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.planBtnText}>
              {isPremium ? 'Already Premium' : `Get ${meta.name}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Unlock Your Full Destiny</Text>
      <Text style={styles.subtitle}>
        Premium gives you unlimited access to every reading, report, and cosmic insight.
      </Text>

      {offeringLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#a78bfa" />
          <Text style={styles.loadingText}>Loading plans…</Text>
        </View>
      ) : (
        <>
          <PlanCard meta={PLAN_META.monthly} pkg={monthlyPkg} />
          <PlanCard meta={PLAN_META.annual} pkg={annualPkg} />
        </>
      )}

      {/* ── Add-ons ─────────────────────────────────────────────────────── */}
      <Text style={styles.addonTitle}>Add-ons (one-time)</Text>
      {ADDON_META.map((a) => {
        const addonPkg = findAddonPkg(a.key);
        const price = addonPkg ? packagePrice(addonPkg) : a.fallbackPrice;
        const isBuying = purchasing === addonPkg?.identifier;
        return (
          <TouchableOpacity
            key={a.key}
            style={styles.addonRow}
            onPress={() => handlePurchase(addonPkg, a.name)}
            disabled={isBuying || purchasing !== null}
          >
            <Text style={styles.addonName}>{a.name}</Text>
            {isBuying ? (
              <ActivityIndicator color="#a78bfa" size="small" />
            ) : (
              <Text style={styles.addonPrice}>{price}</Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* ── Restore ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={handleRestore}
        disabled={restoring || purchasing !== null}
      >
        {restoring ? (
          <ActivityIndicator color="#9d8fbe" size="small" />
        ) : (
          <Text style={styles.restoreText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.legalText}>
        Payment charged to your App Store/Google Play account. Cancel anytime.
        Prices may vary by region.
      </Text>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  close: { alignSelf: 'flex-end', marginBottom: 16 },
  closeText: { color: '#9d8fbe', fontSize: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#b8a9d9', lineHeight: 22, marginBottom: 32 },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#9d8fbe', fontSize: 14 },

  planCard: {
    backgroundColor: '#2d1854',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardHighlight: { borderColor: '#7c3aed' },
  badge: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  planPrice: { fontSize: 32, fontWeight: '800', color: '#fff' },
  feature: { color: '#c4b5fd', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  planBtn: {
    backgroundColor: '#4c1d95',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnHighlight: { backgroundColor: '#7c3aed' },
  planBtnDisabled: { opacity: 0.5 },
  planBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  addonTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d1854',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  addonName: { color: '#d8b4fe', fontSize: 14, flex: 1 },
  addonPrice: { color: '#a78bfa', fontWeight: '700', fontSize: 14 },

  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  restoreText: { color: '#9d8fbe', fontSize: 14, fontWeight: '600' },

  legalText: {
    color: '#5b4d7e',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
