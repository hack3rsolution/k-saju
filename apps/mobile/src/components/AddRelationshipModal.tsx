import { useState, type ReactNode } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { AddRelationshipInput, RelationshipType } from '../types/relationship';
import { LoveIcon, CompatibilityIcon, FamilyIcon, CareerIcon, EtcIcon } from './icons';

// ── Option sets ───────────────────────────────────────────────────────────────

const REL_TYPE_VALUES: { value: RelationshipType; key: string; icon: ReactNode }[] = [
  { value: 'romantic',  key: 'romantic',  icon: <LoveIcon          color="#9d8fbe" size={18} /> },
  { value: 'friend',    key: 'friend',    icon: <CompatibilityIcon color="#9d8fbe" size={18} /> },
  { value: 'family',    key: 'family',    icon: <FamilyIcon        color="#9d8fbe" size={18} /> },
  { value: 'colleague', key: 'colleague', icon: <CareerIcon        color="#9d8fbe" size={18} /> },
  { value: 'other',     key: 'other',     icon: <EtcIcon           color="#9d8fbe" size={18} /> },
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
  const { t } = useTranslation('common');
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

    if (!name.trim())               return Alert.alert(t('relationships.form.nameRequired'));
    if (!y || y < 1900 || y > 2025) return Alert.alert(t('relationships.form.validYear'));
    if (!m || m < 1 || m > 12)      return Alert.alert(t('relationships.form.validMonth'));
    if (!d || d < 1 || d > 31)      return Alert.alert(t('relationships.form.validDay'));

    const parsedHour = hour.trim() ? parseInt(hour, 10) : undefined;
    if (parsedHour != null && (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23)) {
      return Alert.alert(t('relationships.form.validHour'));
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
            <Text style={styles.title}>{t('relationships.form.title')}</Text>

            {/* Name */}
            <Text style={styles.label}>{t('relationships.form.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('relationships.form.namePlaceholder')}
              placeholderTextColor="#5b4d7e"
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            {/* Birth date */}
            <Text style={styles.label}>{t('relationships.form.birthDate')}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('relationships.form.birthYear')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={year}
                onChangeText={setYear}
                maxLength={4}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('relationships.form.birthMonth')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={month}
                onChangeText={setMonth}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('relationships.form.birthDay')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                maxLength={2}
              />
            </View>

            {/* Birth hour (optional) */}
            <Text style={styles.label}>
              {t('relationships.form.birthHour')}{' '}
              <Text style={styles.optional}>{t('relationships.form.hourOptional')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('relationships.form.hourPlaceholder')}
              placeholderTextColor="#5b4d7e"
              keyboardType="number-pad"
              value={hour}
              onChangeText={setHour}
              maxLength={2}
            />

            {/* Gender */}
            <Text style={styles.label}>{t('relationships.form.gender')}</Text>
            <View style={styles.row}>
              {(['M', 'F'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g === 'M' ? t('relationships.form.male') : t('relationships.form.female')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Relationship type */}
            <Text style={styles.label}>{t('relationships.form.relType')}</Text>
            <View style={styles.typeGrid}>
              {REL_TYPE_VALUES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.typeChip, relType === item.value && styles.typeChipActive]}
                  onPress={() => setRelType(item.value)}
                >
                  <View style={styles.typeIcon}>{item.icon}</View>
                  <Text style={[styles.typeLabel, relType === item.value && styles.typeLabelActive]}>
                    {t(`relationships.form.${item.key}`)}
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
                <Text style={styles.submitText}>{t('relationships.form.submit')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
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
  typeIcon:  { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
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
