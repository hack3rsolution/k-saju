import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  STEM_ELEMENT,
} from '@k-saju/saju-engine';
import { WheelPicker } from '../src/components/WheelPicker';
import { useAuthStore } from '../src/store/authStore';
import { useSajuStore } from '../src/store/sajuStore';
import { supabase } from '../src/lib/supabase';

const YEARS = Array.from({ length: 81 }, (_, i) => String(1930 + i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function EditProfileScreen() {
  const { t } = useTranslation('common');
  const { t: tob } = useTranslation('onboarding');
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);
  const { setChart, frame } = useSajuStore();

  const meta = session?.user?.user_metadata ?? {};

  // Pre-populate from saved metadata; default year = 2000, timeKnown = false
  const initYearIdx  = Math.max(0, Math.min(80, (meta.birth_year  ?? 2000) - 1930));
  const initMonthIdx = Math.max(0, (meta.birth_month ?? 1) - 1);
  const initDayIdx   = Math.max(0, (meta.birth_day   ?? 1) - 1);
  const initHourIdx  = meta.birth_hour ?? 12;
  const initGender: 'M' | 'F' | null = meta.gender ?? null;

  const [yearIdx,    setYearIdx]    = useState(initYearIdx);
  const [monthIdx,   setMonthIdx]   = useState(initMonthIdx);
  const [dayIdx,     setDayIdx]     = useState(initDayIdx);
  const [hourIdx,    setHourIdx]    = useState(initHourIdx);
  const [timeKnown,  setTimeKnown]  = useState(false);   // ← always default OFF
  const [gender,     setGender]     = useState<'M' | 'F' | null>(initGender);
  const [saving,     setSaving]     = useState(false);

  const year  = 1930 + yearIdx;
  const month = monthIdx + 1;
  const days  = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => String(i + 1).padStart(2, '0')),
    [year, month],
  );
  const clampedDayIdx = Math.min(dayIdx, days.length - 1);

  async function handleSave() {
    if (!gender) return;
    setSaving(true);
    try {
      const birthYear  = year;
      const birthMonth = month;
      const birthDay   = clampedDayIdx + 1;
      const birthHour  = timeKnown ? hourIdx : null;

      await supabase.auth.updateUser({
        data: { birth_year: birthYear, birth_month: birthMonth, birth_day: birthDay, birth_hour: birthHour, gender },
      });

      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session) setSession(refreshed.session);

      const birthData = { year: birthYear, month: birthMonth, day: birthDay, hour: birthHour ?? undefined, gender };
      const pillars   = calculateFourPillars(birthData);
      const elements  = calculateElementBalance(pillars);
      const daewoon   = calculateDaewoon(birthData);
      const chart     = { pillars, elements, dayStem: pillars.day.stem, dayElement: STEM_ELEMENT[pillars.day.stem] };

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saju_charts').upsert({
          user_id: user.id,
          pillars: JSON.stringify(pillars),
          elements: JSON.stringify(elements),
          day_stem: chart.dayStem,
          day_element: chart.dayElement,
          birth_year: birthYear, birth_month: birthMonth, birth_day: birthDay,
          birth_hour: birthHour, gender,
          cultural_frame: frame ?? meta.cultural_frame ?? 'en',
        });
      }

      setChart(chart, birthData, daewoon, (frame ?? meta.cultural_frame ?? 'en') as never);
      router.back();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('settings.restoreFailedMsg'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Use ScrollView only to allow scrolling on small devices;
            WheelPicker FlatList has nestedScrollEnabled to suppress VirtualizedList warning */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← {t('cancel')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('settings.editProfile')}</Text>

          {/* Date pickers */}
          <View style={styles.pickerCard}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t('compatibility.year')}</Text>
                <WheelPicker data={YEARS} selectedIndex={yearIdx} onIndexChange={setYearIdx} width={92} />
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t('compatibility.month')}</Text>
                <WheelPicker data={MONTHS} selectedIndex={monthIdx} onIndexChange={setMonthIdx} width={68} />
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t('compatibility.day')}</Text>
                <WheelPicker data={days} selectedIndex={clampedDayIdx} onIndexChange={setDayIdx} width={68} />
              </View>
            </View>
          </View>

          {/* Time */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.cardLabel}>{t('onboarding.birthTimeKnown')}</Text>
              <Switch
                value={timeKnown}
                onValueChange={setTimeKnown}
                trackColor={{ true: '#7c3aed', false: '#3d2471' }}
                thumbColor="#fff"
              />
            </View>
            {timeKnown && (
              <View style={styles.hourPicker}>
                <Text style={styles.pickerLabel}>{tob('birthInput.birthTime')}</Text>
                <WheelPicker data={HOURS} selectedIndex={hourIdx} onIndexChange={setHourIdx} width={72} />
              </View>
            )}
          </View>

          {/* Gender */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('relationships.form.gender')}</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'M' && styles.genderBtnActive]}
                onPress={() => setGender('M')}
              >
                <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>{tob('birthInput.male')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'F' && styles.genderBtnActive]}
                onPress={() => setGender('F')}
              >
                <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>{tob('birthInput.female')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (!gender || saving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!gender || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{t('save')}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#1a0a2e' },
  flex:    { flex: 1 },
  content: { padding: 28, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#a78bfa', fontSize: 15, fontWeight: '600' },
  title:   { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 28 },
  pickerCard: {
    backgroundColor: '#2d1854', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 12, marginBottom: 16,
  },
  pickerRow:   { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  pickerCol:   { alignItems: 'center' },
  pickerLabel: { color: '#9d8fbe', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  card:        { backgroundColor: '#2d1854', borderRadius: 16, padding: 16, marginBottom: 16 },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  hourPicker:  { alignItems: 'center', marginTop: 14 },
  genderRow:   { flexDirection: 'row', gap: 12, marginTop: 12 },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 2, borderColor: '#3d2471',
  },
  genderBtnActive:  { borderColor: '#7c3aed', backgroundColor: '#4a1f8a' },
  genderText:       { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
  genderTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
