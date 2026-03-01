/**
 * JournalEventCard — timeline event row for the Life Journal.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LifeEvent, EventCategory } from '../types/journal';

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<EventCategory, { icon: string; color: string }> = {
  career:    { icon: '💼', color: '#6366f1' },
  love:      { icon: '💞', color: '#ec4899' },
  health:    { icon: '🌿', color: '#22c55e' },
  family:    { icon: '🏡', color: '#f59e0b' },
  travel:    { icon: '✈️', color: '#06b6d4' },
  finance:   { icon: '💰', color: '#84cc16' },
  education: { icon: '📚', color: '#a78bfa' },
  other:     { icon: '⭐', color: '#9ca3af' },
};

const SENTIMENT_COLOR: Record<LifeEvent['sentiment'], string> = {
  positive: '#22c55e',
  neutral:  '#9ca3af',
  negative: '#ef4444',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  event:    LifeEvent;
  isLast:   boolean;
  onDelete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JournalEventCard({ event, isLast, onDelete }: Props) {
  const meta = CATEGORY_META[event.category];

  return (
    <View style={styles.row}>
      {/* Timeline line */}
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryIcon}>{meta.icon}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
            <Text style={styles.date}>{event.eventDate}</Text>
          </View>
          <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLOR[event.sentiment] }]} />
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color="#5b4d7e" />
          </TouchableOpacity>
        </View>
        {event.note ? (
          <Text style={styles.note} numberOfLines={2}>{event.note}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 0 },

  timelineCol: { alignItems: 'center', width: 32, paddingTop: 12 },
  dot:  { width: 12, height: 12, borderRadius: 6 },
  line: { flex: 1, width: 2, backgroundColor: '#2d1854', marginTop: 4, minHeight: 24 },

  card: {
    flex: 1,
    backgroundColor: '#2d1854',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginLeft: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryIcon: { fontSize: 20 },
  cardMeta:  { flex: 1 },
  title:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  date:      { color: '#9d8fbe', fontSize: 12, marginTop: 1 },
  sentimentDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  note:  { color: '#c4b5fd', fontSize: 13, marginTop: 8, lineHeight: 18 },
});
