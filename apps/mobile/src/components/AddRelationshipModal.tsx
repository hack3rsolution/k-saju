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
import { useTranslation } from 'react-i18next';
import type { AddRelationshipInput, RelationshipType } from '../types/relationship';

// ── Option sets ───────────────────────────────────────────────────────────────

const REL_TYPE_ICONS: Record<RelationshipType, string> = {
  romantic:  '💞',
  friend:    '🤝',
  family:    '👨‍👩‍👧',
  colleague: '💼',
  other:     '⭐',
};

const REL_TYPE_KEYS: RelationshipType[] = ['romantic', 'friend', 'family', 'colleague', 'other'];

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

    const maxBirthYear = new Date().getFullYear() - 16;
    if (!name.trim())                           return Alert.alert(t('addRelationship.alertName'));
    if (!y || y < 1900 || y > maxBirthYear)    return Alert.alert(t('addRelationship.alertYear', { max: maxBirthYear }));
    if (!m || m < 1 || m > 12)                 return Alert.alert(t('addRelationship.alertMonth'));
    if (!d || d < 1 || d > 31)                 return Alert.alert(t('addRelationship.alertDay'));

    const parsedHour = hour.trim() ? parseInt(hour, 10) : undefined;
    if (parsedHour != null && (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23)) {
      return Alert.alert(t('addRelationship.alertHour'));
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
            <Text style={styles.title}>{t('addRelationship.title')}</Text>

            {/* Name */}
            <Text style={styles.label}>{t('addRelationship.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addRelationship.namePlaceholder')}
              placeholderTextColor="#5b4d7e"
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            {/* Birth date */}
            <Text style={styles.label}>{t('myInfo.birthDate')}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('onboarding:yearPlaceholder', 'YYYY')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={year}
                onChangeText={setYear}
                maxLength={4}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('onboarding:monthPlaceholder', 'MM')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={month}
                onChangeText={setMonth}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder={t('onboarding:dayPlaceholder', 'DD')}
                placeholderTextColor="#5b4d7e"
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                maxLength={2}
              />
            </View>

            {/* Birth hour (optional) */}
            <Text style={styles.label}>
              {t('myInfo.birthTime')}{' '}
              <Text style={styles.optional}>{t('addRelationship.birthHourOptional')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('addRelationship.birthHourPlaceholder')}
              placeholderTextColor="#5b4d7e"
              keyboardType="number-pad"
              value={hour}
              onChangeText={setHour}
              maxLength={2}
            />

            {/* Gender */}
            <Text style={styles.label}>{t('myInfo.gender')}</Text>
            <View style={styles.row}>
              {(['M', 'F'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g === 'M' ? `♂ ${t('myInfo.male')}` : `♀ ${t('myInfo.female')}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Relationship type */}
            <Text style={styles.label}>{t('addRelationship.relTypeLabel')}</Text>
            <View style={styles.typeGrid}>
              {REL_TYPE_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeChip, relType === key && styles.typeChipActive]}
                  onPress={() => setRelType(key)}
                >
                  <Text style={styles.typeIcon}>{REL_TYPE_ICONS[key]}</Text>
                  <Text style={[styles.typeLabel, relType === key && styles.typeLabelActive]}>
                    {t(`addRelationship.relTypes.${key}`)}
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
                <Text style={styles.submitText}>{t('addRelationship.submit')}</Text>
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
