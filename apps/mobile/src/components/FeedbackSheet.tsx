/**
 * FeedbackSheet — bottom sheet for rating a fortune reading.
 * Issue #16: AI Feedback Loop
 *
 * Step 1: User taps 👍 or 👎 (passed in as `initialRating`)
 * Step 2: Sheet shows reason chips (3 examples + 직접 작성) → submit
 */
import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import type { FeedbackRating, FeedbackType } from '../hooks/useFeedback';

interface Reason {
  key: FeedbackType;
  emoji: string;
  label: string;
}

const POSITIVE_REASONS: Reason[] = [
  { key: 'accurate',   emoji: '✨', label: '정확해요' },
  { key: 'insightful', emoji: '💡', label: '통찰력 있어요' },
  { key: 'motivating', emoji: '🌟', label: '힘이 됐어요' },
];

const NEGATIVE_REASONS: Reason[] = [
  { key: 'too_vague',   emoji: '🌫️', label: '너무 모호해요' },
  { key: 'not_me',      emoji: '🤔', label: '나랑 안 맞아요' },
  { key: 'too_general', emoji: '📋', label: '너무 일반적이에요' },
];

interface Props {
  visible: boolean;
  initialRating: FeedbackRating | null;
  submitting: boolean;
  onSelect: (feedbackType: FeedbackType) => void;
  onClose: () => void;
}

export function FeedbackSheet({ visible, initialRating, submitting, onSelect, onClose }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const reasons = initialRating === 1 ? POSITIVE_REASONS : NEGATIVE_REASONS;

  function handleClose() {
    setCustomMode(false);
    setCustomText('');
    onClose();
  }

  function handleCustomSubmit() {
    setCustomMode(false);
    setCustomText('');
    onSelect('custom');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {initialRating === 1 ? '👍 도움이 됐군요!' : '👎 아쉬웠군요'}
          </Text>
          <Text style={styles.subtitle}>이유를 선택해 주세요</Text>

          {submitting ? (
            <ActivityIndicator color="#a78bfa" style={styles.spinner} />
          ) : customMode ? (
            <View style={styles.customContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="직접 입력해 주세요…"
                placeholderTextColor="#6b5a8a"
                value={customText}
                onChangeText={setCustomText}
                multiline
                autoFocus
              />
              <TouchableOpacity
                style={[styles.reasonBtn, styles.customSendBtn]}
                onPress={handleCustomSubmit}
              >
                <Text style={styles.reasonEmoji}>✉️</Text>
                <Text style={styles.reasonLabel}>보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCustomMode(false)}>
                <Text style={styles.cancelText}>← 돌아가기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {reasons.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={styles.reasonBtn}
                  onPress={() => onSelect(r.key)}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text style={styles.reasonLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.reasonBtn}
                onPress={() => setCustomMode(true)}
              >
                <Text style={styles.reasonEmoji}>✏️</Text>
                <Text style={styles.reasonLabel}>직접 작성</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  customContainer: {
    width: '100%',
    alignItems: 'center',
  },
  customInput: {
    width: '100%',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: '#e9d5ff',
    fontSize: 15,
    marginBottom: 10,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  customSendBtn: {
    marginBottom: 0,
  },
});
