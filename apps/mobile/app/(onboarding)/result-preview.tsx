import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function ResultPreviewScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Your Chart Preview</Text>
      <Text style={styles.subtitle}>
        Here's a glimpse of your cosmic blueprint.
      </Text>

      {/* TODO: render partial saju pillars from saju-engine */}
      <View style={styles.preview}>
        <Text style={styles.previewText}>四柱 Chart Preview</Text>
      </View>

      <View style={styles.teaser}>
        <Text style={styles.teaserTitle}>Unlock the full reading</Text>
        <Text style={styles.teaserDesc}>
          Daily fortune, compatibility, annual luck cycle, and more with Premium.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={styles.btnText}>Explore free features →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push('/paywall')}
      >
        <Text style={styles.secondaryBtnText}>View Premium plans</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 32, paddingTop: 80 },
  step: { color: '#7c3aed', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#b8a9d9', marginBottom: 32, lineHeight: 22 },
  preview: {
    backgroundColor: '#2d1854',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  previewText: { color: '#7c6d99', fontSize: 16 },
  teaser: {
    backgroundColor: '#3b1f6e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  teaserTitle: { color: '#e9d5ff', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  teaserDesc: { color: '#b8a9d9', fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
});
