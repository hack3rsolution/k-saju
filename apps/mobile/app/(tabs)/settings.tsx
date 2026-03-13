import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../src/i18n';
import { useLanguageStore } from '../../src/store/languageStore';
import { useAuthStore } from '../../src/store/authStore';
import { useIsPremium } from '../../src/store/entitlementStore';
import { restorePurchases } from '../../src/lib/purchases';
import {
  isDailyNotificationScheduled,
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  setTokensEnabled,
} from '../../src/lib/notifications';

export default function SettingsScreen() {
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { language, setLanguage } = useLanguageStore();
  const { user, signOut } = useAuthStore();
  const isPremium = useIsPremium();

  // Sync notification toggle with actual scheduled state on mount
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
            t('settings.permissionRequired'),
            t('settings.permissionMessage'),
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
      Alert.alert(t('error'), e instanceof Error ? e.message : t('settings.notifError'));
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
        hasActive ? t('settings.restoreSuccess') : t('settings.restoreEmpty'),
        hasActive
          ? t('settings.restoreSuccessMsg')
          : t('settings.restoreEmptyMsg'),
      );
    } catch (e: unknown) {
      Alert.alert(t('settings.restoreFailed'), e instanceof Error ? e.message : t('settings.restoreFailedMsg'));
    } finally {
      setRestoring(false);
    }
  }

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  function handleSelectLanguage(code: SupportedLanguage) {
    setLanguage(code);
    setLangPickerVisible(false);
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t('settings.email')}</Text>
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
            <Text style={styles.rowText}>{t('settings.restore')}</Text>
            {restoring ? (
              <ActivityIndicator color="#9d8fbe" size="small" />
            ) : (
              <Text style={styles.rowValue}>→</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.preferences')}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t('settings.dailyNotification')}</Text>
              <Text style={[styles.rowValue, { fontSize: 11, marginTop: 2 }]}>
                {t('settings.notifReminder')}
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
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(onboarding)/cultural-frame')}>
            <Text style={styles.rowText}>{t('settings.culturalFrame')}</Text>
            <Text style={styles.rowValue}>🇰🇷 Korean →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setLangPickerVisible(true)}>
            <Text style={styles.rowText}>{t('settings.language')}</Text>
            <Text style={styles.rowValue}>
              {currentLang ? `${currentLang.flag} ${currentLang.label}` : language} →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.about')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t('settings.version')}</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={langPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangPickerVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('settings.languageSheet')}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 12, color: '#7c3aed', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
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
  },
  signOutText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
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
