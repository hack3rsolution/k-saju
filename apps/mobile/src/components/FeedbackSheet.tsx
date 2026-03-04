/**
 * FeedbackSheet — bottom sheet for rating a fortune reading.
 * Issue #16: AI Feedback Loop
 *
 * Step 1: User taps 👍 or 👎 (passed in as `initialRating`)
 * Step 2: Sheet shows reason chips → submit
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { FeedbackRating, FeedbackType } from '../hooks/useFeedback';

interface Reason {
  key: FeedbackType;
  emoji: string;
  label: string;
}

const REASONS: Reason[] = [
  { key: 'accurate',  emoji: '✨', label: 'Accurate' },
  { key: 'too_vague', emoji: '🌫️', label: 'Too vague' },
  { key: 'not_me',    emoji: '🤔', label: "Doesn't fit me" },
];

interface Props {
  visible: boolean;
  initialRating: FeedbackRating | null;
  submitting: boolean;
  onSelect: (feedbackType: FeedbackType) => void;
  onClose: () => void;
}

export function FeedbackSheet({ visible, initialRating, submitting, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {initialRating === 1 ? '👍 Glad it helped!' : '👎 Sorry about that'}
          </Text>
          <Text style={styles.subtitle}>Choose a reason</Text>

          {submitting ? (
            <ActivityIndicator color="#a78bfa" style={styles.spinner} />
          ) : (
            REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={styles.reasonBtn}
                onPress={() => onSelect(r.key)}
              >
                <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                <Text style={styles.reasonLabel}>{r.label}</Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3d2471',
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9d8fbe',
    fontSize: 14,
    marginBottom: 24,
  },
  spinner: {
    marginVertical: 24,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  reasonEmoji: {
    fontSize: 22,
  },
  reasonLabel: {
    color: '#e9d5ff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  cancelText: {
    color: '#9d8fbe',
    fontWeight: '600',
    fontSize: 15,
  },
});
