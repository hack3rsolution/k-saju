import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const FORTUNE_PERIODS = [
  { label: 'Daily', icon: '☀️', available: true },
  { label: 'Weekly', icon: '📆', available: true },
  { label: 'Monthly', icon: '🌙', available: false, premium: true },
  { label: 'Annual', icon: '🎆', available: false, premium: true },
  { label: '대운 (10yr)', icon: '♾️', available: false, premium: true },
];

export default function FortuneScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fortune Readings</Text>
      <Text style={styles.subtitle}>운세 · 流年 · Luck Cycles</Text>

      {FORTUNE_PERIODS.map((p) => (
        <TouchableOpacity
          key={p.label}
          style={[styles.card, !p.available && styles.cardLocked]}
          onPress={() => {
            if (!p.available) router.push('/paywall');
          }}
          disabled={p.available && false}
        >
          <Text style={styles.cardIcon}>{p.icon}</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{p.label}</Text>
            {p.premium && <Text style={styles.premiumBadge}>Premium</Text>}
          </View>
          <Text style={styles.arrow}>{p.available ? '→' : '🔒'}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/paywall')}>
        <Text style={styles.upgradeBtnText}>Unlock all fortune readings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9d8fbe', marginBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1854',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardLocked: { opacity: 0.6 },
  cardIcon: { fontSize: 28, marginRight: 16 },
  cardBody: { flex: 1 },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  premiumBadge: {
    color: '#a78bfa',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  arrow: { color: '#9d8fbe', fontSize: 18 },
  upgradeBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
