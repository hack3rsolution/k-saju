import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const REPORT_TYPES = [
  {
    title: 'Annual Fortune 2025',
    subtitle: '流年運 · 년운',
    desc: '12-month cycle based on your pillars vs. annual stems and branches.',
    locked: false,
  },
  {
    title: 'Annual Fortune 2026',
    subtitle: '流年運 · 년운',
    desc: 'Full reading for the upcoming year.',
    locked: true,
  },
  {
    title: '10-Year Luck Cycle (대운)',
    subtitle: '大運 · Daewoon',
    desc: 'Life phase transitions and dominant elemental energy periods.',
    locked: true,
  },
  {
    title: 'Career & Wealth Report',
    subtitle: '재물운 · 관운',
    desc: 'Timing analysis for career moves, business launches, and investments.',
    locked: true,
  },
];

export default function ReportsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>In-depth analysis of your life pillars</Text>

      {REPORT_TYPES.map((r) => (
        <TouchableOpacity
          key={r.title}
          style={[styles.card, r.locked && styles.cardLocked]}
          onPress={() => r.locked && router.push('/paywall')}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardSubtitle}>{r.subtitle}</Text>
            </View>
            {r.locked && <Text style={styles.lock}>🔒</Text>}
          </View>
          <Text style={styles.cardDesc}>{r.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/paywall')}>
        <Text style={styles.upgradeBtnText}>Unlock all reports</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: '#a78bfa', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9d8fbe', marginBottom: 32 },
  card: {
    backgroundColor: '#2d1854',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardLocked: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSubtitle: { fontSize: 12, color: '#9d8fbe', marginTop: 2 },
  lock: { fontSize: 18 },
  cardDesc: { fontSize: 13, color: '#b8a9d9', lineHeight: 20 },
  upgradeBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
