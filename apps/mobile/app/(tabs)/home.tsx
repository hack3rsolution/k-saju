import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good morning ✨</Text>
      <Text style={styles.date}>Saturday, Feb 28 · 戊戌年</Text>

      {/* Daily Fortune Card */}
      <View style={styles.dailyCard}>
        <Text style={styles.cardLabel}>Today's Fortune</Text>
        <Text style={styles.cardTitle}>Wood strengthens — a good day for new beginnings</Text>
        <Text style={styles.cardBody}>
          Your 일주 (Day Pillar) harmonizes with today's energy. Focus on creative work and
          relationship building.
        </Text>
      </View>

      {/* Free preview: 1 reading/week */}
      <View style={styles.limitBanner}>
        <Text style={styles.limitText}>🎁 1 free reading remaining this week</Text>
        <TouchableOpacity onPress={() => router.push('/paywall')}>
          <Text style={styles.upgradeLink}>Upgrade →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Explore</Text>
      <View style={styles.grid}>
        {[
          { label: 'Compatibility', icon: '💞', route: '/compatibility' },
          { label: 'Annual Report', icon: '📅', route: '/reports' },
          { label: 'My Chart', icon: '☯️', route: '/(tabs)/chart' },
          { label: 'Fortune', icon: '⭐', route: '/(tabs)/fortune' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.gridItem}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  date: { fontSize: 14, color: '#9d8fbe', marginBottom: 24 },
  dailyCard: {
    backgroundColor: '#2d1854',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 12, color: '#a78bfa', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12, lineHeight: 26 },
  cardBody: { fontSize: 14, color: '#b8a9d9', lineHeight: 22 },
  limitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3b1f6e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
  },
  limitText: { color: '#d8b4fe', fontSize: 13 },
  upgradeLink: { color: '#a78bfa', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    backgroundColor: '#2d1854',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    alignItems: 'center',
  },
  gridIcon: { fontSize: 28, marginBottom: 8 },
  gridLabel: { color: '#d8b4fe', fontWeight: '600', fontSize: 14 },
});
