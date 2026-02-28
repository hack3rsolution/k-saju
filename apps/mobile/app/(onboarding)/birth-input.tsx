import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function BirthInputScreen() {
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthTime, setBirthTime] = useState<string | null>(null);
  const [gender, setGender] = useState<'M' | 'F' | null>(null);

  const canProceed = birthDate && gender;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Your Birth Info</Text>
      <Text style={styles.subtitle}>
        We use your birth date and time to calculate your Four Pillars (Saju).
      </Text>

      {/* TODO: date picker, time picker, gender selector */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Birth date / time / gender pickers</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !canProceed && styles.buttonDisabled]}
        onPress={() => router.push('/(onboarding)/cultural-frame')}
        disabled={!canProceed}
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
  subtitle: { fontSize: 15, color: '#b8a9d9', marginBottom: 40, lineHeight: 22 },
  placeholder: {
    backgroundColor: '#2d1854',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
  },
  placeholderText: { color: '#7c6d99' },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
