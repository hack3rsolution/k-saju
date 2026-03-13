/**
 * AddEventModal — bottom-sheet modal for adding a life event.
 */
import { useState, type ReactNode } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { EventCategory, EventSentiment, AddEventInput } from '../types/journal';
import { CareerIcon, LoveIcon, HealthIcon, FamilyIcon, TravelIcon, FinanceIcon, BookIcon, EtcIcon } from './icons';

// ── Category options ──────────────────────────────────────────────────────────

const CATEGORY_IDS: EventCategory[] = ['career', 'love', 'health', 'family', 'travel', 'finance', 'education', 'other'];
const CATEGORY_ICONS: Record<EventCategory, ReactNode> = {
  career:    <CareerIcon  color="#c4b5fd" size={14} />,
  love:      <LoveIcon    color="#c4b5fd" size={14} />,
  health:    <HealthIcon  color="#c4b5fd" size={14} />,
  family:    <FamilyIcon  color="#c4b5fd" size={14} />,
  travel:    <TravelIcon  color="#c4b5fd" size={14} />,
  finance:   <FinanceIcon color="#c4b5fd" size={14} />,
  education: <BookIcon    color="#c4b5fd" size={14} />,
  other:     <EtcIcon     color="#c4b5fd" size={14} />,
};

const SENTIMENT_IDS: EventSentiment[] = ['positive', 'neutral', 'negative'];
const SENTIMENT_COLORS: Record<EventSentiment, string> = {
  positive: '#22c55e',
  neutral: '#9ca3af',
  negative: '#ef4444',
};

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
  const { t } = useTranslation('common');
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

          <Text style={styles.heading}>{t('journal.addEvent')}</Text>
          <Text style={styles.subheading}>{t('journal.addEventSub')}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.label}>{t('journal.titleLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('journal.titlePlaceholder')}
              placeholderTextColor="#5b4d7e"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Date */}
            <Text style={styles.label}>{t('journal.dateLabel')}</Text>
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
            <Text style={styles.label}>{t('journal.categoryLabel')}</Text>
            <View style={styles.chipGrid}>
              {CATEGORY_IDS.map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, category === id && styles.chipActive]}
                  onPress={() => setCategory(id)}
                >
                  <View style={styles.chipInner}>
                    {CATEGORY_ICONS[id]}
                    <Text style={styles.chipText}>{t(`journal.categories.${id}`)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sentiment */}
            <Text style={styles.label}>{t('journal.sentimentLabel')}</Text>
            <View style={styles.sentimentRow}>
              {SENTIMENT_IDS.map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.sentimentBtn,
                    sentiment === id && { borderColor: SENTIMENT_COLORS[id], backgroundColor: SENTIMENT_COLORS[id] + '22' },
                  ]}
                  onPress={() => setSentiment(id)}
                >
                  <Text style={styles.sentimentText}>{t(`journal.sentiments.${id}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.label}>{t('journal.noteLabel')}</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder={t('journal.notePlaceholder')}
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
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (!title.trim() || loading) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitText}>{t('journal.saveEvent')}</Text>
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
  chipInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
