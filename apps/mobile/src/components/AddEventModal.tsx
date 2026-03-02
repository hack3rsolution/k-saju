/**
 * AddEventModal — bottom-sheet modal for adding a life event.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { EventCategory, EventSentiment, AddEventInput } from '../types/journal';

// ── Category options ──────────────────────────────────────────────────────────

const CATEGORIES: { id: EventCategory; label: string; icon: string }[] = [
  { id: 'career',    label: 'Career',    icon: '💼' },
  { id: 'love',      label: 'Love',      icon: '💞' },
  { id: 'health',    label: 'Health',    icon: '🌿' },
  { id: 'family',    label: 'Family',    icon: '🏡' },
  { id: 'travel',    label: 'Travel',    icon: '✈️' },
  { id: 'finance',   label: 'Finance',   icon: '💰' },
  { id: 'education', label: 'Study',     icon: '📚' },
  { id: 'other',     label: 'Other',     icon: '⭐' },
];

const SENTIMENTS: { id: EventSentiment; label: string; color: string }[] = [
  { id: 'positive', label: '😊 Positive', color: '#22c55e' },
  { id: 'neutral',  label: '😐 Neutral',  color: '#9ca3af' },
  { id: 'negative', label: '😔 Negative', color: '#ef4444' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible:  boolean;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (input: AddEventInput) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddEventModal({ visible, loading, onClose, onSubmit }: Props) {
  const [title,     setTitle]     = useState('');
  const [category,  setCategory]  = useState<EventCategory>('career');
  const [eventDate, setEventDate] = useState(todayISO());
  const [note,      setNote]      = useState('');
  const [sentiment, setSentiment] = useState<EventSentiment>('positive');

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title:     title.trim(),
      category,
      eventDate,
      note:      note.trim() || undefined,
      sentiment,
    });
    // Reset
    setTitle('');
    setCategory('career');
    setEventDate(todayISO());
    setNote('');
    setSentiment('positive');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.heading}>Add Life Event</Text>
          <Text style={styles.subheading}>인생 이벤트 기록</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Got promoted, Started therapy…"
              placeholderTextColor="#5b4d7e"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Date */}
            <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-03-15"
              placeholderTextColor="#5b4d7e"
              value={eventDate}
              onChangeText={setEventDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, category === c.id && styles.chipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text style={styles.chipText}>{c.icon} {c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sentiment */}
            <Text style={styles.label}>Sentiment</Text>
            <View style={styles.sentimentRow}>
              {SENTIMENTS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.sentimentBtn,
                    sentiment === s.id && { borderColor: s.color, backgroundColor: s.color + '22' },
                  ]}
                  onPress={() => setSentiment(s.id)}
                >
                  <Text style={styles.sentimentText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="What happened? How did it feel?"
              placeholderTextColor="#5b4d7e"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (!title.trim() || loading) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitText}>Save Event</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000aa' },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#5b4d7e',
    alignSelf: 'center', marginBottom: 20,
  },
  heading:    { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subheading: { fontSize: 13, color: '#9d8fbe', marginBottom: 20 },

  label: { color: '#c4b5fd', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#2d1854',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3d2a6e',
  },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#3d2a6e', backgroundColor: '#2d1854',
  },
  chipActive: { borderColor: '#a78bfa', backgroundColor: '#3d2a6e' },
  chipText:   { color: '#c4b5fd', fontSize: 13 },

  sentimentRow: { flexDirection: 'row', gap: 8 },
  sentimentBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#3d2a6e',
    backgroundColor: '#2d1854', alignItems: 'center',
  },
  sentimentText: { color: '#c4b5fd', fontSize: 12 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#3d2a6e', alignItems: 'center',
  },
  cancelText: { color: '#9d8fbe', fontWeight: '600' },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#7c3aed', alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#3d2a6e' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
