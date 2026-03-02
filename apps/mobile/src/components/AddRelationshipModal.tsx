import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { AddRelationshipInput, RelationshipType } from '../types/relationship';

// ── Option sets ───────────────────────────────────────────────────────────────

const REL_TYPES: { value: RelationshipType; label: string; icon: string }[] = [
  { value: 'romantic',  label: 'Romantic',  icon: '💞' },
  { value: 'friend',    label: 'Friend',    icon: '🤝' },
  { value: 'family',    label: 'Family',    icon: '👨‍👩‍👧' },
  { value: 'colleague', label: 'Colleague', icon: '💼' },
  { value: 'other',     label: 'Other',     icon: '⭐' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddRelationshipModalProps {
  visible:  boolean;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (input: AddRelationshipInput) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddRelationshipModal({
  visible, loading, onClose, onSubmit,
}: AddRelationshipModalProps) {
  const [name,   setName]   = useState('');
  const [year,   setYear]   = useState('');
  const [month,  setMonth]  = useState('');
  const [day,    setDay]    = useState('');
  const [hour,   setHour]   = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [relType, setRelType] = useState<RelationshipType>('friend');

  function reset() {
    setName(''); setYear(''); setMonth(''); setDay('');
    setHour(''); setGender('M'); setRelType('friend');
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit() {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (!name.trim())               return Alert.alert('Name required');
    if (!y || y < 1900 || y > 2025) return Alert.alert('Enter a valid birth year (1900–2025)');
    if (!m || m < 1 || m > 12)      return Alert.alert('Enter a valid birth month (1–12)');
    if (!d || d < 1 || d > 31)      return Alert.alert('Enter a valid birth day (1–31)');

    const parsedHour = hour.trim() ? parseInt(hour, 10) : undefined;
    if (parsedHour != null && (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23)) {
      return Alert.alert('Birth hour must be 0–23');
    }

    onSubmit({
      name:             name.trim(),
      birthYear:        y,
      birthMonth:       m,
      birthDay:         d,
      birthHour:        parsedHour,
      gender,
      relationshipType: relType,
    });
    reset();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Relationship</Text>

            {/* Name */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Partner, Friend, etc."
              placeholderTextColor="#5b4d7e"
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            {/* Birth date */}
            <Text style={styles.label}>Birth Date</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Year"
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={year}
                onChangeText={setYear}
                maxLength={4}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Month"
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={month}
                onChangeText={setMonth}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Day"
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                maxLength={2}
              />
            </View>

            {/* Birth hour (optional) */}
            <Text style={styles.label}>Birth Hour <Text style={styles.optional}>(optional, 0–23)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 14 for 2 PM"
              placeholderTextColor="#5b4d7e"
              keyboardType="number-pad"
              value={hour}
              onChangeText={setHour}
              maxLength={2}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.row}>
              {(['M', 'F'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g === 'M' ? '♂ Male' : '♀ Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Relationship type */}
            <Text style={styles.label}>Relationship Type</Text>
            <View style={styles.typeGrid}>
              {REL_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, relType === t.value && styles.typeChipActive]}
                  onPress={() => setRelType(t.value)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, relType === t.value && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Add Relationship</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet:    {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40,
    maxHeight: '90%',
  },
  handle:   { width: 40, height: 4, backgroundColor: '#3d2471', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:    { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label:    { color: '#9d8fbe', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  optional: { color: '#5b4d7e', fontWeight: '400' },
  input:    {
    backgroundColor: '#2d1854', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#3d2471',
  },
  row:      { flexDirection: 'row', gap: 8 },
  flex1:    { flex: 1 },
  chip:     {
    flex: 1, backgroundColor: '#2d1854', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#3d2471',
  },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText:      { color: '#9d8fbe', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  typeGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2d1854', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#3d2471',
  },
  typeChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  typeIcon:  { fontSize: 18 },
  typeLabel: { color: '#9d8fbe', fontWeight: '600', fontSize: 13 },
  typeLabelActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  disabled:    { opacity: 0.6 },
  submitText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn:   { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText:  { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
});
