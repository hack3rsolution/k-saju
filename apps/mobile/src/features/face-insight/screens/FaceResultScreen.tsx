import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { T } from '../../../theme/tokens';
import { useFaceInsightStore } from '../store/faceInsightStore';
import { uploadFaceImage, analyzeFace } from '../services/faceInsightApi';
import { FaceImageInputSheet } from '../components/FaceImageInputSheet';
import { ResultSection } from '../components/ResultSection';
import type { TraditionalResult, StateResult, ImageSource } from '../types';

function isTraditional(
  mode: string | null,
  result: TraditionalResult | StateResult | null,
): result is TraditionalResult {
  return mode === 'traditional' && result !== null;
}

function isState(
  mode: string | null,
  result: TraditionalResult | StateResult | null,
): result is StateResult {
  return mode === 'state' && result !== null;
}

function buildShareText(
  mode: string | null,
  result: TraditionalResult | StateResult | null,
): string {
  if (isTraditional(mode, result)) {
    return [
      'Face Insight — Traditional Reading',
      `Overall: ${result.overallImpression}`,
      `Personality: ${result.personalityTraits.join(', ')}`,
      `Relationship: ${result.relationshipStyle}`,
      `Career: ${result.careerTendency}`,
      `Energy: ${result.faceEnergySummary}`,
    ].join('\n');
  }
  if (isState(mode, result)) {
    return [
      'Face Insight — State Check',
      `Mood: ${result.moodSignal}`,
      `Stress: ${result.stressIndicator}`,
      `Fatigue: ${result.fatigueSignal}`,
      `Emotional Tone: ${result.emotionalTone}`,
      `Self-Care: ${result.selfCareTip}`,
    ].join('\n');
  }
  return 'Face Insight result';
}

export function FaceResultScreen() {
  const store = useFaceInsightStore();
  const user = useAuthStore((s) => s.user);

  const { mode, imageSource, localImageUri, result, sessionId } = store;

  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleImageSelected(uri: string, source: ImageSource) {
    if (!mode || !user) return;

    store.setImageSource(source);
    store.setLocalImageUri(uri);
    store.setStatus('uploading');
    setAnalyzing(true);

    try {
      const { uploadedUrl } = await uploadFaceImage(user.id, uri);
      store.setUploadedImageUrl(uploadedUrl);
      store.setStatus('analyzing');

      const culturalFrame =
        (user.user_metadata?.cultural_frame as string | undefined) ?? 'en';

      const response = await analyzeFace({
        mode,
        imageUrl: uploadedUrl,
        imageSource: source,
        locale: 'en',
        culturalFrame,
        userId: user.id,
      });

      store.setSessionId(response.sessionId);
      store.setResult(response.result);
      store.setStatus('success');
      setSaved(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      store.setStatus('error');
      store.setErrorMessage(msg);
      Alert.alert('Analysis Failed', msg);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!sessionId || !mode || !result || saving || saved) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('face_insight_results').upsert({
        session_id: sessionId,
        mode,
        result,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
      Alert.alert('Saved', 'Result has been saved successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.';
      Alert.alert('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const text = buildShareText(mode, result);
    try {
      await Share.share({ message: text });
    } catch (e) {
      // user dismissed — no-op
    }
  }

  function handleTryAnother() {
    setSaved(false);
    setSheetVisible(true);
  }

  const analysisDate = new Date().toLocaleDateString('en');
  const modeBadge = mode === 'traditional' ? 'Traditional Reading' : 'State Check';

  const policyText =
    mode === 'traditional'
      ? 'This feature provides cultural and entertainment-based interpretations inspired by traditional face reading concepts.'
      : 'This analysis is for wellness awareness only and does not provide medical or psychological diagnosis.';

  if (analyzing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.primary.light} />
          <Text style={styles.loadingText}>
            {store.status === 'uploading' ? 'Uploading photo…' : 'Analyzing your face…'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No result available.</Text>
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.back()}>
            <Text style={styles.ctaSecondaryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top section */}
        <View style={styles.topSection}>
          <View style={styles.topMeta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{modeBadge}</Text>
            </View>
            <Text style={styles.dateText}>{analysisDate}</Text>
          </View>
          {localImageUri ? (
            <Image
              source={{ uri: localImageUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : null}
        </View>

        {/* Result sections */}
        <View style={styles.card}>
          {isTraditional(mode, result) && (
            <>
              <ResultSection label="Overall Impression" value={result.overallImpression} />
              <ResultSection label="Personality Traits" value={result.personalityTraits} />
              <ResultSection label="Relationship Style" value={result.relationshipStyle} />
              <ResultSection label="Career Tendency" value={result.careerTendency} />
              <ResultSection label="Face Energy Summary" value={result.faceEnergySummary} />
            </>
          )}
          {isState(mode, result) && (
            <>
              <ResultSection label="Mood Signal" value={result.moodSignal} />
              <ResultSection label="Stress Indicator" value={result.stressIndicator} />
              <ResultSection label="Fatigue Signal" value={result.fatigueSignal} />
              <ResultSection label="Emotional Tone" value={result.emotionalTone} />
              <ResultSection label="Self-Care Tip" value={result.selfCareTip} />
            </>
          )}
        </View>

        {/* CTA buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.ctaSecondary} onPress={handleTryAnother}>
            <Text style={styles.ctaSecondaryText}>Try Another Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaPrimary, saved && styles.ctaDisabled]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <ActivityIndicator size="small" color={T.text.primary} />
            ) : (
              <Text style={styles.ctaPrimaryText}>
                {saved ? 'Saved' : 'Save Result'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctaSecondary} onPress={handleShare}>
            <Text style={styles.ctaSecondaryText}>Share Result</Text>
          </TouchableOpacity>
        </View>

        {/* Policy text */}
        <Text style={styles.policy}>{policyText}</Text>
      </ScrollView>

      <FaceImageInputSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onImageSelected={handleImageSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg.surface,
  },
  content: {
    padding: T.spacing[6],
    paddingBottom: T.spacing[8],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing[4],
  },
  loadingText: {
    color: T.text.secondary,
    fontSize: T.fontSize.base,
    fontWeight: '600',
  },
  errorText: {
    color: T.text.muted,
    fontSize: T.fontSize.base,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing[6],
  },
  topMeta: {
    flex: 1,
    gap: T.spacing[2],
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: T.primary.muted,
    borderRadius: T.radius.md,
    paddingVertical: T.spacing[2],
    paddingHorizontal: T.spacing[3],
  },
  badgeText: {
    color: T.primary.light,
    fontSize: T.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateText: {
    color: T.text.muted,
    fontSize: T.fontSize.xs,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginLeft: T.spacing[4],
  },
  card: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    padding: T.spacing[5],
    marginBottom: T.spacing[6],
  },
  ctaSection: {
    gap: T.spacing[3],
    marginBottom: T.spacing[6],
  },
  ctaPrimary: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaPrimaryText: {
    color: T.text.primary,
    fontSize: T.fontSize.base,
    fontWeight: '700',
  },
  ctaSecondary: {
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.primary.DEFAULT,
  },
  ctaSecondaryText: {
    color: T.primary.light,
    fontSize: T.fontSize.base,
    fontWeight: '600',
  },
  policy: {
    color: T.text.caption,
    fontSize: T.fontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
});
