import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const PLANS = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: '$8.99',
    period: '/month',
    highlight: false,
    features: [
      'Unlimited daily fortune readings',
      'Monthly & annual luck cycles',
      '대운 (10-year cycle) analysis',
      'Compatibility reports',
      'All cultural frame styles',
    ],
  },
  {
    id: 'yearly',
    name: 'Premium Annual',
    price: '$59.99',
    period: '/year',
    highlight: true,
    badge: 'Best Value · Save 44%',
    features: [
      'Everything in Monthly',
      '2 add-on reports per year',
      'Priority AI readings',
      'Early access to new features',
    ],
  },
];

const ADDONS = [
  { name: 'Deep Compatibility Report', price: '$4.99' },
  { name: 'Career & Wealth Report', price: '$4.99' },
  { name: 'Full 대운 Report (PDF)', price: '$6.99' },
  { name: 'Name Analysis (작명)', price: '$9.99' },
];

export default function PaywallScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Unlock Your Full Destiny</Text>
      <Text style={styles.subtitle}>
        Premium gives you unlimited access to every reading, report, and cosmic insight.
      </Text>

      {PLANS.map((plan) => (
        <View key={plan.id} style={[styles.planCard, plan.highlight && styles.planCardHighlight]}>
          {plan.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
          </View>
          {plan.features.map((f) => (
            <Text key={f} style={styles.feature}>✓  {f}</Text>
          ))}
          <TouchableOpacity style={[styles.planBtn, plan.highlight && styles.planBtnHighlight]}>
            <Text style={styles.planBtnText}>Get {plan.name}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.addonTitle}>Add-ons (one-time)</Text>
      {ADDONS.map((a) => (
        <TouchableOpacity key={a.name} style={styles.addonRow}>
          <Text style={styles.addonName}>{a.name}</Text>
          <Text style={styles.addonPrice}>{a.price}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.legalText}>
        Payment charged to your App Store/Google Play account. Cancel anytime.
        Prices may vary by region.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 56 },
  close: { alignSelf: 'flex-end', marginBottom: 16 },
  closeText: { color: '#9d8fbe', fontSize: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#b8a9d9', lineHeight: 22, marginBottom: 32 },
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
  planPeriod: { fontSize: 14, color: '#9d8fbe', marginLeft: 4 },
  feature: { color: '#c4b5fd', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  planBtn: {
    backgroundColor: '#4c1d95',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnHighlight: { backgroundColor: '#7c3aed' },
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
  legalText: { color: '#5b4d7e', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
