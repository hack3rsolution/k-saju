/**
 * FeedbackSheet — bottom sheet for rating a fortune reading.
 * Issue #16: AI Feedback Loop
 *
 * Step 1: User taps 👍 or 👎 (passed in as `initialRating`)
 * Step 2: Sheet shows reason chips → submit
 */
import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FeedbackRating, FeedbackType } from '../hooks/useFeedback';

interface Props {
  visible: boolean;
  initialRating: FeedbackRating | null;
  submitting: boolean;
  onSelect: (feedbackType: FeedbackType) => void;
  onClose: () => void;
}

const POSITIVE_REASON_KEYS: { key: string; emoji: string }[] = [
  { key: 'accurate',        emoji: '✨' },
  { key: 'want_more_depth', emoji: '🔮' },
  { key: 'new_perspective', emoji: '💡' },
];

const NEGATIVE_REASON_KEYS: { key: string; emoji: string }[] = [
  { key: 'too_generic',        emoji: '🌫️' },
  { key: 'factually_wrong',    emoji: '❌' },
  { key: 'hard_to_understand', emoji: '🤔' },
];

export function FeedbackSheet({ visible, initialRating, submitting, onSelect, onClose }: Props) {
  const { t } = useTranslation('fortune');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const reasonKeys = initialRating === 1 ? POSITIVE_REASON_KEYS : NEGATIVE_REASON_KEYS;
  const reasons = reasonKeys.map((r) => ({ ...r, label: t(`feedback.reasons.${r.key}`) }));

  function handleClose() {
    setShowCustomInput(false);
    setCustomText('');
    onClose();
  }

  function handleSelect(key: string) {
    setShowCustomInput(false);
    setCustomText('');
    onSelect(key);
  }

  function handleCustomSend() {
    if (!customText.trim()) return;
    onSelect(customText.trim());
    setShowCustomInput(false);
    setCustomText('');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {initialRating === 1 ? t('feedback.titlePositive') : t('feedback.titleNegative')}
          </Text>
          <Text style={styles.subtitle}>{t('feedback.chooseReason')}</Text>

          {submitting ? (
            <ActivityIndicator color="#a78bfa" style={styles.spinner} />
          ) : showCustomInput ? (
            <>
              <TextInput
                style={styles.customInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder={t('feedback.reasons.customPlaceholder')}
                placeholderTextColor="#5b4d7e"
                multiline
                autoFocus
              />
              <TouchableOpacity
                style={[styles.sendBtn, !customText.trim() && styles.sendBtnDisabled]}
                onPress={handleCustomSend}
                disabled={!customText.trim()}
              >
                <Text style={styles.sendBtnText}>{t('feedback.reasons.send')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomInput(false)}>
                <Text style={styles.cancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {reasons.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={styles.reasonBtn}
                  onPress={() => handleSelect(r.key)}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text style={styles.reasonLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.reasonBtn}
                onPress={() => setShowCustomInput(true)}
              >
                <Text style={styles.reasonEmoji}>✏️</Text>
                <Text style={styles.reasonLabel}>{t('feedback.reasons.customInput')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
            </>
          )}
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
  customInput: {
    width: '100%',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#e9d5ff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#5b4d7e',
  },
  sendBtn: {
    width: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
