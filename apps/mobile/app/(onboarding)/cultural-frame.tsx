import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

const FRAMES = [
  { id: 'kr', label: '사주팔자', region: '🇰🇷 Korean', desc: 'Traditional Four Pillars reading' },
  { id: 'cn', label: '四柱推命', region: '🇨🇳 Chinese', desc: 'BaZi classical system' },
  { id: 'jp', label: '四柱推命', region: '🇯🇵 Japanese', desc: 'Japanese destiny reading' },
  { id: 'en', label: 'Cosmic Blueprint', region: '🌏 Western', desc: 'Personality & life path focus' },
  { id: 'es', label: 'Destino Cósmico', region: '🌎 Latin', desc: 'Horoscope-style framing' },
  { id: 'in', label: 'Vedic Fusion', region: '🇮🇳 South Asian', desc: 'Jyotish-inspired perspective' },
] as const;

type FrameId = (typeof FRAMES)[number]['id'];

export default function CulturalFrameScreen() {
  const [selected, setSelected] = useState<FrameId | null>(null);

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
        >
          <Text style={styles.region}>{f.region}</Text>
          <Text style={styles.label}>{f.label}</Text>
          <Text style={styles.desc}>{f.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={() => router.push('/(onboarding)/result-preview')}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 32, paddingTop: 80 },
  step: { color: '#7c3aed', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#b8a9d9', marginBottom: 24, lineHeight: 22 },
  card: {
    backgroundColor: '#2d1854',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#7c3aed' },
  region: { fontSize: 13, color: '#b8a9d9', marginBottom: 4 },
  label: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  desc: { fontSize: 13, color: '#9d8fbe' },
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
