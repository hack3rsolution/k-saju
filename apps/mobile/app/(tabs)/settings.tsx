import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>Email</Text>
          <Text style={styles.rowValue}>user@example.com</Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/paywall')}>
          <Text style={styles.rowText}>Subscription</Text>
          <Text style={styles.rowValueAccent}>Free → Upgrade</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>Daily Notification</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ true: '#7c3aed', false: '#2d1854' }}
          />
        </View>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(onboarding)/cultural-frame')}>
          <Text style={styles.rowText}>Cultural Frame</Text>
          <Text style={styles.rowValue}>🇰🇷 Korean →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
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
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  signOutText: { color: '#a78bfa', fontWeight: '600', fontSize: 16 },
});
