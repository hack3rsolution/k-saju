import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { WheelPicker } from '../../src/components/WheelPicker';
import { useOnboardingStore } from '../../src/store/onboardingStore';

const YEARS = Array.from({ length: 81 }, (_, i) => String(1930 + i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function BirthInputScreen() {
  const { setBirthData } = useOnboardingStore();

  const [yearIdx, setYearIdx] = useState(60);   // 1990
  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [hourIdx, setHourIdx] = useState(12);
  const [timeKnown, setTimeKnown] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | null>(null);

  const year = 1930 + yearIdx;
  const month = monthIdx + 1;
  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth(year, month) }, (_, i) =>
        String(i + 1).padStart(2, '0'),
      ),
    [year, month],
  );
  const clampedDayIdx = Math.min(dayIdx, days.length - 1);

  function handleContinue() {
    setBirthData({
      birthYear: year,
      birthMonth: month,
      birthDay: clampedDayIdx + 1,
      birthHour: timeKnown ? hourIdx : null,
      gender,
    });
    router.push('/(onboarding)/cultural-frame');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Your Birth Info</Text>
      <Text style={styles.subtitle}>
        We use your birth date and time to calculate your Four Pillars (四柱).
      </Text>

      {/* Date pickers */}
      <View style={styles.pickerCard}>
        <View style={styles.pickerRow}>
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Year</Text>
            <WheelPicker data={YEARS} selectedIndex={yearIdx} onIndexChange={setYearIdx} width={92} />
          </View>
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Month</Text>
            <WheelPicker data={MONTHS} selectedIndex={monthIdx} onIndexChange={setMonthIdx} width={68} />
          </View>
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Day</Text>
            <WheelPicker
              data={days}
              selectedIndex={clampedDayIdx}
              onIndexChange={setDayIdx}
              width={68}
            />
          </View>
        </View>
      </View>

      {/* Time */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.cardLabel}>Birth time known?</Text>
          <Switch
            value={timeKnown}
            onValueChange={setTimeKnown}
            trackColor={{ true: '#7c3aed', false: '#3d2471' }}
            thumbColor="#fff"
          />
        </View>
        {timeKnown && (
          <View style={styles.hourPicker}>
            <Text style={styles.pickerLabel}>Hour (24h)</Text>
            <WheelPicker data={HOURS} selectedIndex={hourIdx} onIndexChange={setHourIdx} width={72} />
          </View>
        )}
      </View>

      {/* Gender */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Gender</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'M' && styles.genderBtnActive]}
            onPress={() => setGender('M')}
          >
            <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'F' && styles.genderBtnActive]}
            onPress={() => setGender('F')}
          >
            <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, !gender && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!gender}
      >
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 28, paddingTop: 72, paddingBottom: 40 },
  step: { color: '#7c3aed', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#b8a9d9', marginBottom: 28, lineHeight: 22 },
  pickerCard: {
    backgroundColor: '#2d1854',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  pickerCol: { alignItems: 'center' },
  pickerLabel: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  card: { backgroundColor: '#2d1854', borderRadius: 16, padding: 16, marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hourPicker: { alignItems: 'center', marginTop: 14 },
  genderRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d2471',
  },
  genderBtnActive: { borderColor: '#7c3aed', backgroundColor: '#4a1f8a' },
  genderText: { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
  genderTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
