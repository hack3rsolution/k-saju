/**
 * TimingResultSheet — bottom sheet showing timing advisor results.
 * Issue #17: Timing Advisor
 *
 * Shows: score gauge (1-10), headline, 3 reasons, 2 cautions.
 */
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import type { TimingAdvice } from '../hooks/useTimingAdvisor';

// ── Score color ───────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e';
  if (score >= 6) return '#a78bfa';
  if (score >= 4) return '#eab308';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 8) return '최적';
  if (score >= 6) return '양호';
  if (score >= 4) return '보통';
  return '비추';
}

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${score * 10}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <View style={gaugeStyles.labels}>
        <Text style={[gaugeStyles.score, { color }]}>{score}</Text>
        <Text style={gaugeStyles.outOf}>/10</Text>
        <Text style={[gaugeStyles.badge, { backgroundColor: color + '22', color }]}>
          {scoreLabel(score)}
        </Text>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20 },
  track: {
    height: 8,
    backgroundColor: '#3d2471',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: { height: '100%', borderRadius: 4 },
  labels: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  score: { fontSize: 36, fontWeight: '800' },
  outOf: { fontSize: 18, color: '#9d8fbe', marginTop: 8 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 'auto',
  },
});

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  loading: boolean;
  advice: TimingAdvice | null;
  limitReached: boolean;
  error: string | null;
  onClose: () => void;
}

export function TimingResultSheet({ visible, loading, advice, limitReached, error, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#a78bfa" size="large" />
              <Text style={styles.loadingText}>사주 분석 중…</Text>
            </View>
          ) : limitReached ? (
            <View style={styles.centerBox}>
              <Text style={styles.limitIcon}>🔒</Text>
              <Text style={styles.limitTitle}>이번 달 무료 분석 완료</Text>
              <Text style={styles.limitDesc}>
                Premium으로 업그레이드하면 매일 무제한 타이밍 분석이 가능합니다.
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => { onClose(); router.push('/paywall'); }}
              >
                <Text style={styles.upgradeBtnText}>Premium 업그레이드 →</Text>
              </TouchableOpacity>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : advice ? (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>⏰ 타이밍 분석 결과</Text>

              <ScoreGauge score={advice.score} />

              <Text style={styles.headline}>{advice.headline}</Text>

              {/* Reasons */}
              <Text style={styles.sectionLabel}>✅ 긍정 요인</Text>
              {advice.reasons.map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Text style={styles.bullet}>·</Text>
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}

              {/* Cautions */}
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>⚠️ 주의 사항</Text>
              {advice.cautions.map((c, i) => (
                <View key={i} style={styles.cautionRow}>
                  <Text style={styles.cautionBullet}>·</Text>
                  <Text style={styles.cautionText}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#3d2471',
    borderRadius: 2,
    marginBottom: 20,
    alignSelf: 'center',
  },
  scroll: { flexGrow: 0 },
  centerBox: { alignItems: 'center', paddingVertical: 24 },
  loadingText: { color: '#9d8fbe', marginTop: 16, fontSize: 15 },
  limitIcon: { fontSize: 40, marginBottom: 12 },
  limitTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 8 },
  limitDesc: { color: '#b8a9d9', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  upgradeBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  title: { color: '#a78bfa', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 16 },
  headline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 20,
  },
  sectionLabel: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  reasonRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bullet: { color: '#22c55e', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  reasonText: { flex: 1, color: '#b8a9d9', fontSize: 14, lineHeight: 22 },
  cautionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  cautionBullet: { color: '#eab308', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  cautionText: { flex: 1, color: '#b8a9d9', fontSize: 14, lineHeight: 22 },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  closeBtnText: { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
});
