import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CulturalFrame } from '@k-saju/saju-engine';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { T } from '../../src/theme/tokens';

const FRAME_IDS: { id: CulturalFrame; kanji: string }[] = [
  { id: 'kr', kanji: '命' },
  { id: 'cn', kanji: '八' },
  { id: 'jp', kanji: '運' },
  { id: 'en', kanji: '✦' },
  { id: 'es', kanji: '★' },
  { id: 'in', kanji: 'ॐ' },
];

export default function CulturalFrameScreen() {
  const { t } = useTranslation(['common', 'onboarding']);
  const { setFrame } = useOnboardingStore();
  const [selected, setSelected] = useState<CulturalFrame | null>(null);

  function handleContinue() {
    if (!selected) return;
    setFrame(selected);
    router.push('/(onboarding)/result-preview');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Step indicator ── */}
      <View style={styles.stepRow}>
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={[styles.stepDot, n === 2 && styles.stepDotActive, n < 2 && styles.stepDotDone]}
          />
        ))}
      </View>
      <Text style={styles.step}>{t('onboarding:step', { current: 2, total: 3 })}</Text>
      <Text style={styles.title}>{t('onboarding:culturalFrame.title')}</Text>

      {/* ── Decorative line ── */}
      <View style={styles.titleDivider}>
        <View style={styles.titleDividerLine} />
        <Text style={styles.titleDividerGlyph}>사</Text>
        <View style={styles.titleDividerLine} />
      </View>

      <Text style={styles.subtitle}>{t('onboarding:culturalFrame.subtitle')}</Text>

      {FRAME_IDS.map((f) => {
        const accent = T.frameAccent[f.id];
        const isSelected = selected === f.id;
        return (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.card,
              isSelected && { borderColor: accent, backgroundColor: accent + '18' },
            ]}
            onPress={() => setSelected(f.id)}
            activeOpacity={0.7}
          >
            {/* Background kanji watermark */}
            <Text style={[styles.cardDeco, { color: accent }]}>{f.kanji}</Text>

            {/* Left accent bar */}
            {isSelected && (
              <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
            )}

            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={styles.region}>{t(`onboarding:culturalFrame.frames.${f.id}.region`)}</Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: accent }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, isSelected && { color: accent === T.frameAccent.en ? T.primary.light : '#fff' }]}>
                {t(`onboarding:culturalFrame.frames.${f.id}.label`)}
              </Text>
              <Text style={styles.desc}>{t(`onboarding:culturalFrame.frames.${f.id}.desc`)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>{t('onboarding:culturalFrame.continue')} →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg.surface },
  content: { padding: T.spacing[7], paddingTop: 72, paddingBottom: T.spacing[10] },

  // Step indicator
  stepRow: { flexDirection: 'row', gap: 6, marginBottom: T.spacing[2] },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: T.border.default,
  },
  stepDotActive: { width: 20, backgroundColor: T.primary.DEFAULT },
  stepDotDone: { backgroundColor: T.primary.light },

  step: { color: T.primary.DEFAULT, fontWeight: '600', fontSize: T.fontSize.sm, marginBottom: 6 },
  title: { fontSize: T.fontSize['3xl'], fontWeight: '800', color: T.text.primary, marginBottom: 10, letterSpacing: -0.5 },

  // Decorative divider
  titleDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  titleDividerLine: { flex: 1, height: 1, backgroundColor: T.border.default },
  titleDividerGlyph: {
    color: T.primary.light,
    fontSize: T.fontSize.base,
    fontWeight: '700',
    opacity: 0.7,
  },

  subtitle: { fontSize: T.fontSize.base, color: T.text.muted, marginBottom: 24, lineHeight: 22 },

  card: {
    borderRadius: T.radius.lg,
    padding: T.spacing[4],
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: T.border.default,
    backgroundColor: T.bg.card,
    overflow: 'hidden',
    position: 'relative',
  },

  cardDeco: {
    position: 'absolute',
    fontSize: 80,
    fontWeight: '900',
    opacity: 0.06,
    right: 12,
    top: -8,
    zIndex: 0,
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    borderTopLeftRadius: T.radius.lg,
    borderBottomLeftRadius: T.radius.lg,
    zIndex: 1,
  },
  cardInner: { zIndex: 2 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  region: { fontSize: T.fontSize.sm, color: T.text.muted, fontWeight: '500' },
  checkBadge: { borderRadius: T.radius.sm, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  label: { fontSize: T.fontSize.lg, fontWeight: '700', color: T.text.primary, marginBottom: 4 },
  desc: { fontSize: T.fontSize.sm, color: T.text.faint, lineHeight: 18 },

  button: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius.md,
    paddingVertical: T.spacing[4],
    alignItems: 'center',
    marginTop: T.spacing[2],
    ...T.shadow.md,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: T.fontSize.md },
});
