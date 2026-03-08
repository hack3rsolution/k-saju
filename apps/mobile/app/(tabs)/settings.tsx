import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../src/i18n';
import { useLanguageStore } from '../../src/store/languageStore';
import { useAuthStore } from '../../src/store/authStore';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import { useSajuStore } from '../../src/store/sajuStore';
import { restorePurchases } from '../../src/lib/purchases';
import { supabase } from '../../src/lib/supabase';
import type { CulturalFrame } from '@k-saju/saju-engine';
import {
  isDailyNotificationScheduled,
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  setTokensEnabled,
} from '../../src/lib/notifications';

// ── Cultural frame config ────────────────────────────────────────────────────

const FRAMES: { id: CulturalFrame; label: string; region: string; flag: string }[] = [
  { id: 'kr', label: '사주팔자',       region: 'Korean',     flag: '🇰🇷' },
  { id: 'cn', label: 'BaZi / 四柱',   region: 'Chinese',    flag: '🇨🇳' },
  { id: 'jp', label: '四柱推命',       region: 'Japanese',   flag: '🇯🇵' },
  { id: 'en', label: 'Cosmic Blueprint', region: 'Western', flag: '🌟' },
  { id: 'es', label: 'Destino Cósmico', region: 'Latin',    flag: '🌺' },
  { id: 'in', label: 'Vedic Fusion',  region: 'South Asian', flag: '🇮🇳' },
];

// ── Day stem Korean readings ─────────────────────────────────────────────────

const STEM_KR: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t } = useTranslation('common');

  function formatBirthTime(hour: number | undefined): string {
    if (hour === undefined || hour === null) return t('myInfo.notEntered');
    const period = hour < 12 ? t('myInfo.am') : t('myInfo.pm');
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = t('myInfo.hourSuffix');
    return suffix ? `${period} ${h}${suffix}` : `${h} ${period}`;
  }
  const [notifications, setNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [framePickerVisible, setFramePickerVisible] = useState(false);
  const [frameSaving, setFrameSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { language, setLanguage } = useLanguageStore();
  const { user, signOut, setOnboardingCompleted } = useAuthStore();
  const { isPremium } = useEntitlementStore();
  const { frame, updateFrame, clear: clearSaju, birthData, chart } = useSajuStore();

  // Resolve birth info: prefer in-memory store, fall back to user_metadata
  const meta = user?.user_metadata;
  const resolvedBirth = birthData ?? (meta?.birth_year ? {
    year: meta.birth_year as number,
    month: meta.birth_month as number,
    day: meta.birth_day as number,
    hour: meta.birth_hour as number | undefined,
    gender: (meta.gender ?? 'M') as 'M' | 'F',
  } : null);

  // Derive current frame: prefer store, then user_metadata
  const metaFrame = user?.user_metadata?.cultural_frame as CulturalFrame | undefined;
  const currentFrameId: CulturalFrame = frame ?? metaFrame ?? 'en';
  const currentFrame = FRAMES.find((f) => f.id === currentFrameId) ?? FRAMES[3];

  useEffect(() => {
    isDailyNotificationScheduled().then(setNotifications).catch(() => {});
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handleToggleNotifications(value: boolean) {
    setNotifLoading(true);
    try {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            t('notificationPermTitle'),
            t('notificationPermMsg'),
          );
          return;
        }
        await scheduleDailyNotification();
        if (user?.id) await setTokensEnabled(user.id, true);
      } else {
        await cancelDailyNotification();
        if (user?.id) await setTokensEnabled(user.id, false);
      }
      setNotifications(value);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('notifUpdateError'));
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const hasActive = Object.keys(info.entitlements.active).length > 0;
      Alert.alert(
        hasActive ? t('purchasesRestored') : t('nothingToRestore'),
        hasActive ? t('purchasesRestoredMsg') : t('nothingToRestoreMsg'),
      );
    } catch (e: unknown) {
      Alert.alert(t('restoreFailed'), e instanceof Error ? e.message : t('retry'));
    } finally {
      setRestoring(false);
    }
  }

  async function handleSelectFrame(newFrame: CulturalFrame) {
    setFramePickerVisible(false);
    if (newFrame === currentFrameId) return;

    setFrameSaving(true);
    try {
      // 1) Update in-memory store immediately
      updateFrame(newFrame);
      // 2) Persist to Supabase user metadata
      const { error } = await supabase.auth.updateUser({ data: { cultural_frame: newFrame } });
      if (error) throw error;
      // 3) Explicitly refresh the session so hooks that re-run due to frame/language
      //    dep changes receive a consistent fresh token and avoid "Invalid JWT" errors.
      await supabase.auth.refreshSession();
    } catch (e) {
      Alert.alert(t('error'), t('frameSaveError'));
      // Revert
      updateFrame(currentFrameId);
    } finally {
      setFrameSaving(false);
    }
  }

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  function handleSelectLanguage(code: SupportedLanguage) {
    setLanguage(code);
    setLangPickerVisible(false);
  }

  function handleRerunOnboarding() {
    Alert.alert(
      'Re-run Onboarding',
      'This will reset your saju data and take you back to the onboarding flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-run',
          style: 'destructive',
          onPress: () => {
            clearSaju();
            setOnboardingCompleted(false);
            // Persist reset to Supabase so it survives app restarts
            supabase.auth.updateUser({
              data: { onboarding_completed: false },
            }).catch(console.error);
            router.replace('/(onboarding)/birth-input');
          },
        },
      ],
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings')}</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('account')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t('email')}</Text>
            <Text style={styles.rowValue}>{user?.email ?? '—'}</Text>
          </View>
          <TouchableOpacity
            style={styles.row}
            onPress={() => !isPremium && router.push('/paywall')}
            disabled={isPremium}
          >
            <Text style={styles.rowText}>{t('premium')}</Text>
            {isPremium ? (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium ✓</Text>
              </View>
            ) : (
              <Text style={styles.rowValueAccent}>{t('free')} → {t('upgrade')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleRestore} disabled={restoring}>
            <Text style={styles.rowText}>{t('restorePurchases')}</Text>
            {restoring ? (
              <ActivityIndicator color="#9d8fbe" size="small" />
            ) : (
              <Text style={styles.rowValue}>→</Text>
            )}
          </TouchableOpacity>
        </View>

        {resolvedBirth && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('myInfo.title')}</Text>
              <TouchableOpacity onPress={() => router.push('/(onboarding)/birth-input')}>
                <Text style={styles.sectionEditBtn}>{t('myInfo.edit')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowText}>{t('myInfo.birthDate')}</Text>
              <Text style={styles.rowValue}>
                {t('myInfo.birthDateFmt', { year: resolvedBirth.year, month: resolvedBirth.month, day: resolvedBirth.day })}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowText}>{t('myInfo.birthTime')}</Text>
              <Text style={styles.rowValue}>{formatBirthTime(resolvedBirth.hour)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowText}>{t('myInfo.gender')}</Text>
              <Text style={styles.rowValue}>{resolvedBirth.gender === 'M' ? t('myInfo.male') : t('myInfo.female')}</Text>
            </View>
            {chart && (
              <View style={styles.row}>
                <Text style={styles.rowText}>{t('myInfo.dayStem')}</Text>
                <Text style={styles.rowValue}>
                  {chart.dayStem}{language === 'ko' && STEM_KR[chart.dayStem] ? ` (${STEM_KR[chart.dayStem]})` : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('preferences')}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t('dailyNotification')}</Text>
              <Text style={[styles.rowValue, { fontSize: 11, marginTop: 2 }]}>
                {t('dailyNotificationDesc')}
              </Text>
            </View>
            {notifLoading ? (
              <ActivityIndicator color="#7c3aed" size="small" />
            ) : (
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: '#7c3aed', false: '#2d1854' }}
                thumbColor="#fff"
              />
            )}
          </View>
          <TouchableOpacity style={styles.row} onPress={() => setFramePickerVisible(true)}>
            <Text style={styles.rowText}>{t('culturalFrame')}</Text>
            {frameSaving ? (
              <ActivityIndicator color="#9d8fbe" size="small" />
            ) : (
              <Text style={styles.rowValue}>
                {currentFrame.flag} {t(`frames.${currentFrame.id}`)} →
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setLangPickerVisible(true)}>
            <Text style={styles.rowText}>{t('language')}</Text>
            <Text style={styles.rowValue}>
              {currentLang ? `${currentLang.flag} ${currentLang.label}` : language} →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('about')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t('version')}</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '2.3.0'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>

        {/* DEV-only: Re-run Onboarding */}
        {__DEV__ && (
          <TouchableOpacity style={styles.devBtn} onPress={handleRerunOnboarding}>
            <Text style={styles.devBtnText}>⚡ {t('rerunOnboarding')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Language picker modal ── */}
      <Modal
        visible={langPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangPickerVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('language')}</Text>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.langRow, item.code === language && styles.langRowActive]}
                onPress={() => handleSelectLanguage(item.code as SupportedLanguage)}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text style={[styles.langLabel, item.code === language && styles.langLabelActive]}>
                  {item.label}
                </Text>
                {item.code === language && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.sheetClose} onPress={() => setLangPickerVisible(false)}>
            <Text style={styles.sheetCloseText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Cultural Frame picker modal ── */}
      <Modal
        visible={framePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFramePickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFramePickerVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('culturalFrame')}</Text>
          <Text style={styles.sheetSubtitle}>{t('culturalFrameSubtitle')}</Text>
          <FlatList
            data={FRAMES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.langRow, item.id === currentFrameId && styles.langRowActive]}
                onPress={() => handleSelectFrame(item.id)}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, item.id === currentFrameId && styles.langLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.frameRegion}>{t(`frames.${item.id}`)}</Text>
                </View>
                {item.id === currentFrameId && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.sheetClose} onPress={() => setFramePickerVisible(false)}>
            <Text style={styles.sheetCloseText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 12, color: '#7c3aed', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionEditBtn: { fontSize: 13, color: '#a78bfa', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d1854',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  rowText: { color: '#fff', fontSize: 15 },
  rowValue: { color: '#9d8fbe', fontSize: 14 },
  rowValueAccent: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  premiumBadge: {
    backgroundColor: '#16a34a22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  premiumBadgeText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
    marginBottom: 16,
  },
  signOutText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
  devBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 40,
  },
  devBtnText: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  sheetSubtitle: { color: '#9d8fbe', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  langRowActive: { backgroundColor: '#2d1854' },
  langFlag: { fontSize: 22, marginRight: 12 },
  langLabel: { flex: 1, color: '#9d8fbe', fontSize: 16 },
  langLabelActive: { color: '#fff', fontWeight: '600' },
  frameRegion: { color: '#5b4d7e', fontSize: 12, marginTop: 2 },
  checkmark: { color: '#a78bfa', fontSize: 18, fontWeight: '700' },
  sheetClose: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  sheetCloseText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
});
