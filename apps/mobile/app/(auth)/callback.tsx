import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    if (!code) return;
    const exchange = async () => {
      try {
        // TODO: supabase.auth.exchangeCodeForSession(code)
        router.replace('/(tabs)/home');
      } catch {
        router.replace('/(auth)/login');
      }
    };
    exchange();
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
