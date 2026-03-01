import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { Relationship, RelationshipFortuneData, CompatibilityStatus } from '../types/relationship';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  good:    '#22c55e',
  neutral: '#eab308',
  caution: '#ef4444',
};

const STATUS_EMOJI: Record<CompatibilityStatus, string> = {
  good:    '🟢',
  neutral: '🟡',
  caution: '🔴',
};

const STATUS_LABEL: Record<CompatibilityStatus, string> = {
  good:    'Harmonious',
  neutral: 'Balanced',
  caution: 'Challenging',
};

const ELEMENT_COLOR: Record<string, string> = {
  Wood: '#22c55e', Fire: '#ef4444', Earth: '#eab308', Metal: '#94a3b8', Water: '#3b82f6',
};

const ELEMENT_EMOJI: Record<string, string> = {
  Wood: '🌱', Fire: '🔥', Earth: '⛰️', Metal: '✦', Water: '🌊',
};

// ── Compatibility Score Arc ───────────────────────────────────────────────────

function ScoreRing({ score, status }: { score: number; status: CompatibilityStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <View style={ring.container}>
      <View style={[ring.outer, { borderColor: color + '44' }]}>
        <View style={[ring.inner, { borderColor: color }]}>
          <Text style={[ring.scoreText, { color }]}>{score}</Text>
          <Text style={ring.outOf}>/100</Text>
        </View>
      </View>
      <View style={ring.statusRow}>
        <Text style={ring.statusEmoji}>{STATUS_EMOJI[status]}</Text>
        <Text style={[ring.statusLabel, { color }]}>{STATUS_LABEL[status]}</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  container:  { alignItems: 'center', marginVertical: 20 },
  outer:      { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  inner:      { width: 96,  height: 96,  borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText:  { fontSize: 32, fontWeight: '800' },
  outOf:      { color: '#9d8fbe', fontSize: 11 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  statusEmoji:{ fontSize: 14 },
  statusLabel:{ fontWeight: '700', fontSize: 14 },
});

// ── Element Synergy Chart ─────────────────────────────────────────────────────

function ElementSynergyChart({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <View style={synergy.container}>
      <Text style={synergy.title}>Element Synergy</Text>
      {Object.entries(data).map(([elem, count]) => (
        <View key={elem} style={synergy.row}>
          <Text style={synergy.emoji}>{ELEMENT_EMOJI[elem] ?? '·'}</Text>
          <Text style={synergy.elemLabel}>{elem}</Text>
          <View style={synergy.barBg}>
            <View
              style={[synergy.bar, {
                width: `${(count / max) * 100}%` as `${number}%`,
                backgroundColor: ELEMENT_COLOR[elem] ?? '#7c3aed',
              }]}
            />
          </View>
          <Text style={synergy.count}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

const synergy = StyleSheet.create({
  container: { marginTop: 16 },
  title:     { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emoji:     { fontSize: 14, width: 20 },
  elemLabel: { color: '#d8b4fe', fontSize: 12, width: 42, fontWeight: '600' },
  barBg:     { flex: 1, height: 8, backgroundColor: '#1a0a2e', borderRadius: 4, overflow: 'hidden' },
  bar:       { height: 8, borderRadius: 4 },
  count:     { color: '#9d8fbe', fontSize: 12, width: 16, textAlign: 'right' },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface RelationshipDetailSheetProps {
  visible:       boolean;
  relationship:  Relationship | null;
  fortune:       RelationshipFortuneData | null;
  loading:       boolean;
  error:         string | null;
  onClose:       () => void;
  onLoadFortune: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RelationshipDetailSheet({
  visible, relationship: rel, fortune, loading, error, onClose, onLoadFortune,
}: RelationshipDetailSheetProps) {
  if (!rel) return null;

  const monthLabel = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={styles.name}>{rel.name}</Text>
            <Text style={styles.subtitle}>
              {rel.birthYear}.{String(rel.birthMonth).padStart(2,'0')}.{String(rel.birthDay).padStart(2,'0')}
              {rel.birthHour != null ? ` · ${rel.birthHour}:00` : ''} · {rel.gender === 'M' ? '♂' : '♀'}
            </Text>

            {/* Fortune section */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#a78bfa" size="large" />
                <Text style={styles.loadingText}>Analyzing compatibility…</Text>
              </View>
            ) : error === 'premium_required' ? (
              <View style={styles.lockedBox}>
                <Text style={styles.lockedIcon}>🔒</Text>
                <Text style={styles.lockedTitle}>Premium Feature</Text>
                <Text style={styles.lockedDesc}>
                  Relationship analysis requires Premium or the Deep Compatibility add-on.
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={onLoadFortune}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : fortune ? (
              <>
                {/* Score ring */}
                <ScoreRing score={fortune.compatibilityScore} status={fortune.compatibilityStatus} />

                {/* Summary */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Compatibility Summary</Text>
                  <Text style={styles.cardText}>{fortune.summary}</Text>
                </View>

                {/* Monthly flow */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{monthLabel} Energy Flow</Text>
                  <Text style={styles.cardText}>{fortune.monthlyFlow}</Text>
                </View>

                {/* Strengths */}
                {fortune.strengths.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Strengths ✨</Text>
                    {fortune.strengths.map((s, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bullet}>·</Text>
                        <Text style={styles.bulletText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Cautions */}
                {fortune.cautions.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Things to Watch ⚠️</Text>
                    {fortune.cautions.map((c, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={[styles.bullet, { color: '#f87171' }]}>·</Text>
                        <Text style={styles.bulletText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Element synergy */}
                <View style={styles.card}>
                  <ElementSynergyChart data={fortune.elementSynergy} />
                </View>
              </>
            ) : (
              <TouchableOpacity style={styles.analyzeBtn} onPress={onLoadFortune}>
                <Text style={styles.analyzeIcon}>✨</Text>
                <View>
                  <Text style={styles.analyzeBtnText}>Analyze Compatibility</Text>
                  <Text style={styles.analyzeBtnSub}>{monthLabel} reading</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#1a0a2e', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40, maxHeight: '92%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#3d2471', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  name:     { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#9d8fbe', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 4 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#9d8fbe', fontSize: 14 },
  lockedBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  lockedIcon: { fontSize: 36 },
  lockedTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  lockedDesc: { color: '#9d8fbe', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7c3aed33', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#a78bfa', fontWeight: '600' },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#2d1854', borderRadius: 16, padding: 20, marginTop: 20,
    borderWidth: 1, borderColor: '#7c3aed55',
  },
  analyzeIcon:    { fontSize: 28 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  analyzeBtnSub:  { color: '#9d8fbe', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#2d1854', borderRadius: 14, padding: 16, marginTop: 10 },
  cardLabel: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  cardText:  { color: '#e9d5ff', fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bullet:    { color: '#a78bfa', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  bulletText:{ flex: 1, color: '#b8a9d9', fontSize: 14, lineHeight: 22 },
  closeBtn: {
    marginTop: 16, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#3d2471', alignItems: 'center',
  },
  closeBtnText: { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
});
