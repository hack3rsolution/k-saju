import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEntitlementStore } from '../../../store/entitlementStore';
import { useAuthStore } from '../../../store/authStore';
import { T } from '../../../theme/tokens';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { FaceModeCard } from '../components/FaceModeCard';
import { FaceImageInputSheet } from '../components/FaceImageInputSheet';
import { useFaceInsightStore } from '../store/faceInsightStore';
import { uploadFaceImage, analyzeFace } from '../services/faceInsightApi';
import type { FaceInsightMode, ImageSource } from '../types';

export function FaceInsightHomeScreen() {
  const { t } = useTranslation('common');
  const isPremium = useEntitlementStore((s) => s.isPremium);
  const user = useAuthStore((s) => s.user);
  const store = useFaceInsightStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<FaceInsightMode | null>(null);

  function handleModePress(mode: FaceInsightMode) {
    const isLocked = mode === 'traditional' && !isPremium;
    if (isLocked) {
      router.push('/paywall');
      return;
    }
    store.reset();
    setSelectedMode(mode);
    setSheetVisible(true);
  }

  async function handleImageSelected(uri: string, source: ImageSource) {
    if (!selectedMode || !user) return;

    store.setMode(selectedMode);
    store.setImageSource(source);
    store.setLocalImageUri(uri);
    store.setStatus('uploading');

    try {
      const { uploadedUrl } = await uploadFaceImage(user.id, uri);
      store.setUploadedImageUrl(uploadedUrl);
      store.setStatus('analyzing');

      const culturalFrame =
        (user.user_metadata?.cultural_frame as string | undefined) ?? 'en';

      const response = await analyzeFace({
        mode: selectedMode,
        imageUrl: uploadedUrl,
        imageSource: source,
        locale: 'en',
        culturalFrame,
        userId: user.id,
      });

      store.setSessionId(response.sessionId);
      store.setResult(response.result);
      store.setStatus('success');
      router.push('/face-result');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      store.setStatus('error');
      store.setErrorMessage(msg);
      Alert.alert('Analysis Failed', msg);
    }
  }

  const isLoading =
    store.status === 'uploading' || store.status === 'analyzing';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={t('face.title')} subtitle={t('face.subtitle')} />

          {/* State card first */}
          <FaceModeCard
            mode="state"
            onPress={() => handleModePress('state')}
          />

          {/* Traditional card second — locked for free users */}
          <FaceModeCard
            mode="traditional"
            onPress={() => handleModePress('traditional')}
            isPremiumLocked={!isPremium}
          />
        </ScrollView>

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={T.primary.light} />
              <Text style={styles.loadingText}>
                {store.status === 'uploading' ? t('face.uploading') : t('face.analyzing')}
              </Text>
            </View>
          </View>
        )}

        <FaceImageInputSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onImageSelected={handleImageSelected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg.surface,
  },
  container: {
    flex: 1,
    backgroundColor: T.bg.surface,
  },
  content: {
    padding: T.spacing[6],
    paddingTop: 60,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 0, 22, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius['2xl'],
    padding: T.spacing[8],
    alignItems: 'center',
    gap: T.spacing[4],
    ...T.shadow.lg,
  },
  loadingText: {
    color: T.text.secondary,
    fontSize: T.fontSize.base,
    fontWeight: '600',
  },
});
