import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import type { CulturalFrame } from '@k-saju/saju-engine';
import { useOnboardingStore } from '../../src/store/onboardingStore';

const FRAMES: { id: CulturalFrame; label: string; region: string; desc: string }[] = [
  { id: 'kr', label: '사주팔자', region: '🇰🇷 Korean', desc: 'Traditional classical: destiny, family line, karma' },
  { id: 'cn', label: '四柱推命 / BaZi', region: '🇨🇳 Chinese', desc: 'Precision forecasting, business timing' },
  { id: 'jp', label: '四柱推命', region: '🇯🇵 Japanese', desc: 'Harmony, workplace fit, subtle personality' },
  { id: 'en', label: 'Cosmic Blueprint', region: '🌏 Western', desc: 'Personality-first, psychology overlay (like MBTI)' },
  { id: 'es', label: 'Destino Cósmico', region: '🌎 Latin', desc: 'Horoscope-adjacent, relationship & passion focus' },
  { id: 'in', label: 'Vedic Fusion', region: '🇮🇳 South Asian', desc: 'Jyotish vocabulary, karma & dharma framing' },
];

export default function CulturalFrameScreen() {
  const { setFrame } = useOnboardingStore();
  const [selected, setSelected] = useState<CulturalFrame | null>(null);

  function handleContinue() {
    if (!selected) return;
    setFrame(selected);
    router.push('/(onboarding)/result-preview');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 2 of 3</Text>
      <Text style={styles.title}>Choose Your Lens</Text>
      <Text style={styles.subtitle}>
        Same cosmic data — personalized to your cultural context.
      </Text>

      {FRAMES.map((f) => (
        <TouchableOpacity
          key={f.id}
          style={[styles.card, selected === f.id && styles.cardSelected]}
          onPress={() => setSelected(f.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.region}>{f.region}</Text>
            {selected === f.id && <Text style={styles.check}>✓</Text>}
          </View>
          <Text style={styles.label}>{f.label}</Text>
          <Text style={styles.desc}>{f.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 28, paddingTop: 72, paddingBottom: 40 },
  step: { color: '#7c3aed', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#b8a9d9', marginBottom: 24, lineHeight: 22 },
  card: {
    backgroundColor: '#2d1854',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#7c3aed', backgroundColor: '#3a1e6a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  region: { fontSize: 13, color: '#b8a9d9' },
  check: { color: '#a78bfa', fontSize: 16, fontWeight: '700' },
  label: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  desc: { fontSize: 13, color: '#9d8fbe', lineHeight: 18 },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
