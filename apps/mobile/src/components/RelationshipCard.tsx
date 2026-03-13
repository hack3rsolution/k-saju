import { type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Relationship, CompatibilityStatus } from '../types/relationship';
import { LoveIcon, CompatibilityIcon, FamilyIcon, CareerIcon, EtcIcon } from './icons';

// ── Type icons ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, ReactNode> = {
  romantic:  <LoveIcon          color="#C9A84C" size={22} />,
  friend:    <CompatibilityIcon color="#C9A84C" size={22} />,
  family:    <FamilyIcon        color="#C9A84C" size={22} />,
  colleague: <CareerIcon        color="#C9A84C" size={22} />,
  other:     <EtcIcon           color="#C9A84C" size={22} />,
};

const TYPE_LABEL: Record<string, string> = {
  romantic:  'Romantic',
  friend:    'Friend',
  family:    'Family',
  colleague: 'Colleague',
  other:     'Other',
};

// ── Status colour ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  good:    '#22c55e',
  neutral: '#eab308',
  caution: '#ef4444',
};

const STATUS_LABEL: Record<CompatibilityStatus, string> = {
  good:    'Harmonious',
  neutral: 'Balanced',
  caution: 'Challenging',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface RelationshipCardProps {
  relationship: Relationship;
  onPress:      () => void;
  onDelete:     () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RelationshipCard({ relationship: rel, onPress, onDelete }: RelationshipCardProps) {
  const status = rel.compatibilityStatus;
  const score  = rel.compatibilityScore;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Left: type icon */}
      <View style={styles.iconWrap}>
        {TYPE_ICON[rel.relationshipType] ?? <EtcIcon color="#C9A84C" size={22} />}
      </View>

      {/* Middle: info */}
      <View style={styles.info}>
        <Text style={styles.name}>{rel.name}</Text>
        <View style={styles.row}>
          <Text style={styles.typeLabel}>{TYPE_LABEL[rel.relationshipType]}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.birth}>
            {rel.birthYear}.{String(rel.birthMonth).padStart(2, '0')}.{String(rel.birthDay).padStart(2, '0')}
          </Text>
        </View>

        {status ? (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
            <Text style={[styles.statusLabel, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
            {score != null && (
              <Text style={styles.score}> {score}/100</Text>
            )}
          </View>
        ) : (
          <Text style={styles.tapHint}>Tap to analyze →</Text>
        )}
      </View>

      {/* Right: delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={(e) => { e.stopPropagation(); onDelete(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={16} color="#5b4d7e" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#2d1854',
    borderRadius:    16,
    padding:         16,
    marginBottom:    10,
    gap:             12,
  },
  iconWrap: {
    width:            44,
    height:           44,
    borderRadius:     22,
    backgroundColor:  '#1a0a2e',
    alignItems:       'center',
    justifyContent:   'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  info:     { flex: 1 },
  name:     { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 2 },
  row:      { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  typeLabel:{ color: '#9d8fbe', fontSize: 12, fontWeight: '600' },
  dot:      { color: '#5b4d7e', fontSize: 12 },
  birth:    { color: '#9d8fbe', fontSize: 12 },
  statusRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  score:    { color: '#9d8fbe', fontSize: 12 },
  tapHint:  { color: '#7c5fbf', fontSize: 12, fontStyle: 'italic' },
  deleteBtn:{ padding: 4 },
});
