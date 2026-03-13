import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';

type LoadingKey = 'magic' | 'google' | 'apple' | null;

export default function LoginScreen() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithMagicLink, signInWithGoogle, signInWithApple, signInDev } = useAuthStore();

  async function withLoading(key: LoadingKey, fn: () => Promise<void>) {
    setLoading(key);
    setError(null);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>K-Saju</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        {sent ? (
          <Text style={styles.success}>{t('login.checkInbox')}</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={[styles.button, !!loading && styles.buttonDisabled]}
              onPress={() =>
                withLoading('magic', async () => {
                  if (!email.trim()) throw new Error(t('login.enterEmail'));
                  await signInWithMagicLink(email.trim());
                  setSent(true);
                })
              }
              disabled={!!loading}
            >
              {loading === 'magic' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('login.sendMagicLink')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, !!loading && styles.buttonDisabled]}
              onPress={() => withLoading('google', signInWithGoogle)}
              disabled={!!loading}
            >
              {loading === 'google' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" style={styles.icon} />
                  <Text style={styles.socialText}>{t('login.continueGoogle')}</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.appleButton, !!loading && styles.buttonDisabled]}
                onPress={() => withLoading('apple', signInWithApple)}
                disabled={!!loading}
              >
                {loading === 'apple' ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#000" style={styles.icon} />
                    <Text style={styles.appleText}>{t('login.signInApple')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            {(process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true' || __DEV__) && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={signInDev}
              >
                <Text style={styles.devButtonText}>⚡ Dev Login</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 40, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#b8a9d9', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#2d1854',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2d1854' },
  dividerText: { color: '#888', marginHorizontal: 12, fontSize: 14 },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#2d1854',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4a2d7a',
  },
  appleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: { marginRight: 8 },
  socialText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  appleText: { color: '#000', fontWeight: '600', fontSize: 15 },
  error: { color: '#f87171', marginTop: 12, textAlign: 'center' },
  success: { color: '#4ade80', fontSize: 16, textAlign: 'center' },
  devButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devButtonText: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },
});
