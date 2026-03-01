import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { setSession } = useAuthStore();

  useEffect(() => {
    if (!code) {
      router.replace('/(auth)/login');
      return;
    }
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error || !data.session) throw error ?? new Error('No session');
        setSession(data.session);
        router.replace('/(tabs)/home');
      })
      .catch(() => router.replace('/(auth)/login'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#b8a9d9', marginTop: 16, fontSize: 16 },
});
