import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Placeholder labels — saju-engine will compute real values
const PILLARS = [
  { label: '연주\nYear', stem: '甲', branch: '子' },
  { label: '월주\nMonth', stem: '丙', branch: '午' },
  { label: '일주\nDay', stem: '戊', branch: '戌' },
  { label: '시주\nHour', stem: '庚', branch: '辰' },
];

const FIVE_ELEMENTS = [
  { element: '木 Wood', score: 2, color: '#4ade80' },
  { element: '火 Fire', score: 3, color: '#f97316' },
  { element: '土 Earth', score: 1, color: '#eab308' },
  { element: '金 Metal', score: 1, color: '#e2e8f0' },
  { element: '水 Water', score: 1, color: '#60a5fa' },
];

export default function ChartScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Four Pillars</Text>
      <Text style={styles.subtitle}>사주팔자 · BaZi · 四柱推命</Text>

      {/* Eight Characters Grid */}
      <View style={styles.pillarsRow}>
        {PILLARS.map((p) => (
          <View key={p.label} style={styles.pillar}>
            <Text style={styles.pillarLabel}>{p.label}</Text>
            <View style={styles.stemBox}>
              <Text style={styles.stemChar}>{p.stem}</Text>
            </View>
            <View style={styles.branchBox}>
              <Text style={styles.branchChar}>{p.branch}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Five Elements Balance */}
      <Text style={styles.sectionTitle}>Five Elements Balance</Text>
      {FIVE_ELEMENTS.map((e) => (
        <View key={e.element} style={styles.elementRow}>
          <Text style={[styles.elementLabel, { color: e.color }]}>{e.element}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${(e.score / 8) * 100}%`, backgroundColor: e.color }]} />
          </View>
          <Text style={styles.elementScore}>{e.score}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9d8fbe', marginBottom: 32 },
  pillarsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  pillar: { alignItems: 'center', flex: 1 },
  pillarLabel: { fontSize: 11, color: '#9d8fbe', textAlign: 'center', marginBottom: 10, lineHeight: 16 },
  stemBox: {
    backgroundColor: '#7c3aed',
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchBox: {
    backgroundColor: '#2d1854',
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stemChar: { fontSize: 26, color: '#fff', fontWeight: '700' },
  branchChar: { fontSize: 26, color: '#c4b5fd', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  elementLabel: { width: 90, fontSize: 13, fontWeight: '600' },
  barBg: { flex: 1, backgroundColor: '#2d1854', borderRadius: 6, height: 8, marginHorizontal: 12 },
  barFill: { height: 8, borderRadius: 6 },
  elementScore: { color: '#9d8fbe', width: 20, textAlign: 'right', fontSize: 13 },
});
