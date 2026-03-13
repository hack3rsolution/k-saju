import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert,
} from 'react-native'
import { nativeCalendarService } from '../../services/nativeCalendarService'
import type { AuspiciousDay, EventType } from '../../types/calendar'

const STATUS_LABEL: Record<string, string> = {
  lucky: '길일 🌟', neutral: '보통', unlucky: '흉일 ⚠️',
}
const STATUS_COLOR: Record<string, string> = {
  lucky: '#4CAF50', neutral: '#9CA3AF', unlucky: '#E53935',
}

interface Props {
  day: AuspiciousDay
  eventType: EventType
  onClose: () => void
  isPremium?: boolean
  onUpgradePress?: () => void
}

export function DayDetailModal({ day, eventType, onClose, isPremium = false, onUpgradePress }: Props) {
  const [addingCalendar, setAddingCalendar]   = useState(false)
  const [scheduling,     setScheduling]       = useState(false)
  const [notifyDays,     setNotifyDays]       = useState<number[]>([1, 3, 7])

  const handleAddToCalendar = async () => {
    if (!isPremium) { onUpgradePress?.(); return }
    setAddingCalendar(true)
    try {
      await nativeCalendarService.addAuspiciousDay(day, eventType)
      Alert.alert('완료', '캘린더에 추가되었습니다.')
    } catch (e) {
      Alert.alert('오류', String(e))
    } finally {
      setAddingCalendar(false)
    }
  }

  const handleScheduleNotifications = async () => {
    if (!isPremium) { onUpgradePress?.(); return }
    setScheduling(true)
    try {
      const ids = await nativeCalendarService.scheduleNotifications(day, eventType)
      Alert.alert('완료', `알림 ${ids.length}개가 예약되었습니다.`)
    } catch (e) {
      Alert.alert('오류', String(e))
    } finally {
      setScheduling(false)
    }
  }

  const toggleNotifyDay = (d: number) => {
    setNotifyDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* 날짜 & 상태 */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{day.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[day.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[day.status] }]}>
              {STATUS_LABEL[day.status]}
            </Text>
          </View>
        </View>

        {/* 천간/지지 배지 */}
        <View style={styles.ganjiRow}>
          <View style={styles.ganjiBadge}>
            <Text style={styles.ganjiLabel}>천간</Text>
            <Text style={styles.ganjiChar}>{day.heavenlyStem}</Text>
          </View>
          <View style={styles.ganjiBadge}>
            <Text style={styles.ganjiLabel}>지지</Text>
            <Text style={styles.ganjiChar}>{day.earthlyBranch}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{day.score}점</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* AI 해석 섹션 */}
          {isPremium ? (
            day.interpretation ? (
              <View style={styles.interpretSection}>
                <Text style={styles.summary}>{day.interpretation.summary}</Text>
                <InterpRow icon="📋" label="이유"  value={day.interpretation.reason} />
                <InterpRow icon="💡" label="조언"  value={day.interpretation.advice} />
                <InterpRow icon="🎨" label="행운색" value={day.interpretation.luckyColor} />
                <InterpRow icon="⏰" label="추천시간" value={day.interpretation.luckyTime} />
              </View>
            ) : (
              <View style={styles.loadingSection}>
                <Text style={styles.loadingText}>AI 해석 불러오는 중...</Text>
              </View>
            )
          ) : (
            <TouchableOpacity style={styles.blurSection} onPress={onUpgradePress} activeOpacity={0.8}>
              <Text style={styles.blurEmoji}>🔒</Text>
              <Text style={styles.blurTitle}>Premium에서 AI 해석 보기</Text>
              <Text style={styles.blurSub}>길흉 이유, 조언, 행운색, 추천 시간대</Text>
              <View style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>업그레이드</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 알림 D-N 선택 */}
          <View style={styles.notifyRow}>
            <Text style={styles.sectionTitle}>알림 설정</Text>
            <View style={styles.notifyChips}>
              {[7, 3, 1].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.notifyChip, notifyDays.includes(d) && styles.notifyChipActive]}
                  onPress={() => toggleNotifyDay(d)}
                >
                  <Text style={[styles.notifyChipText, notifyDays.includes(d) && styles.notifyChipTextActive]}>
                    D-{d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 액션 버튼 */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.calBtn, addingCalendar && styles.disabledBtn]}
              onPress={handleAddToCalendar}
              disabled={addingCalendar}
            >
              <Text style={styles.actionBtnText}>
                {addingCalendar ? '추가 중...' : '📅 캘린더에 추가'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.notifyBtn, scheduling && styles.disabledBtn]}
              onPress={handleScheduleNotifications}
              disabled={scheduling}
            >
              <Text style={styles.actionBtnText}>
                {scheduling ? '예약 중...' : '🔔 알림 예약'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function InterpRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={interpStyles.row}>
      <Text style={interpStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={interpStyles.label}>{label}</Text>
        <Text style={interpStyles.value}>{value}</Text>
      </View>
    </View>
  )
}

const interpStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  icon:  { fontSize: 18, marginTop: 2 },
  label: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  value: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
})

const styles = StyleSheet.create({
  backdrop:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:            { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 34, maxHeight: '80%' },
  handle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  dateRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateText:         { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  statusBadge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  statusText:       { fontSize: 14, fontWeight: '600' },
  ganjiRow:         { flexDirection: 'row', gap: 8, marginBottom: 16 },
  ganjiBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  ganjiLabel:       { fontSize: 11, color: '#6B7280' },
  ganjiChar:        { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  scoreBadge:       { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  scoreText:        { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  scroll:           { flexGrow: 0 },
  interpretSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  summary:          { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  loadingSection:   { alignItems: 'center', padding: 24 },
  loadingText:      { color: '#9CA3AF', fontSize: 14 },
  blurSection:      { alignItems: 'center', padding: 24, backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 16 },
  blurEmoji:        { fontSize: 32, marginBottom: 8 },
  blurTitle:        { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  blurSub:          { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  upgradeBtn:       { backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  upgradeBtnText:   { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  notifyRow:        { marginBottom: 16 },
  sectionTitle:     { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  notifyChips:      { flexDirection: 'row', gap: 8 },
  notifyChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  notifyChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  notifyChipText:   { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  notifyChipTextActive: { color: '#7C3AED', fontWeight: '700' },
  actions:          { gap: 10, marginBottom: 8 },
  actionBtn:        { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  calBtn:           { backgroundColor: '#1D4ED8' },
  notifyBtn:        { backgroundColor: '#7C3AED' },
  disabledBtn:      { opacity: 0.5 },
  actionBtnText:    { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})
