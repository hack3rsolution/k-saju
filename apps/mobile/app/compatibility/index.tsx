import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function CompatibilityScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Compatibility</Text>
      <Text style={styles.subtitle}>궁합 · 合婚 · Relationship Harmony</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enter a partner's birth date</Text>
        <Text style={styles.cardDesc}>
          Compare Four Pillars charts to reveal elemental harmony, clash cycles,
          and long-term compatibility scores.
        </Text>
        {/* TODO: partner birth-date input + saju-engine compatibility calc */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Partner birth-date input</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/paywall')}>
        <Text style={styles.premiumBtnText}>🔒 Unlock Full Report (Premium)</Text>
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
  card: { backgroundColor: '#2d1854', borderRadius: 20, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 10 },
  cardDesc: { fontSize: 14, color: '#b8a9d9', lineHeight: 22, marginBottom: 24 },
  placeholder: { backgroundColor: '#1a0a2e', borderRadius: 12, padding: 32, alignItems: 'center' },
  placeholderText: { color: '#5b4d7e' },
  premiumBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  premiumBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
