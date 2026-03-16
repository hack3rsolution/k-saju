import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { AuspiciousDay, DayStatus } from '../../types/calendar'

// DayStatus별 오방색 매핑 — declared before STATUS_STYLE reference below

const STATUS_STYLE: Record<DayStatus, { bg: string; border: string; marker: string }> = {
  lucky:   { bg: '#E8F5E9', border: '#4CAF50', marker: '🌟' },
  neutral: { bg: '#FFFFFF', border: '#E0E0E0', marker: ''   },
  unlucky: { bg: '#FFEBEE', border: '#E53935', marker: '⚠️' },
}

interface Props {
  day: AuspiciousDay
  isToday: boolean
  isCurrentMonth: boolean
  onPress: (day: AuspiciousDay) => void
  /** Free 유저: lucky 날 중 상위 3개만 표시, 나머지 neutral */
  visibleStatus?: DayStatus
  /** Free 유저: 오늘+7일 이후 날짜 — 흐릿하게 + 잠금 표시 */
  isBlurred?: boolean
}

export function DayCell({ day, isToday, isCurrentMonth, onPress, visibleStatus, isBlurred }: Props) {
  const effectiveStatus = visibleStatus ?? day.status
  const style = STATUS_STYLE[effectiveStatus]
  const dayNumber = day.date.split('-')[2]

  return (
    <TouchableOpacity
      onPress={() => !isBlurred && onPress(day)}
      style={[
        styles.cell,
        { backgroundColor: style.bg, borderColor: style.border },
        isToday && styles.todayBorder,
        !isCurrentMonth && styles.otherMonth,
        isBlurred && styles.blurredCell,
      ]}
      activeOpacity={isBlurred ? 1 : 0.7}
    >
      {isToday && <View style={styles.todayDot} />}
      <Text style={[styles.dayNumber, !isCurrentMonth && styles.otherMonthText, isBlurred && styles.blurredText]}>
        {dayNumber}
      </Text>
      {effectiveStatus !== 'neutral' && !isBlurred && (
        <Text style={styles.marker}>{style.marker}</Text>
      )}
      {isBlurred && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  cell:           { flex: 1, aspectRatio: 1, margin: 2, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  todayBorder:    { borderWidth: 2, borderColor: '#2563EB' },
  otherMonth:     { opacity: 0.35 },
  todayDot:       { position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: '#2563EB' },
  dayNumber:      { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  otherMonthText: { color: '#9CA3AF' },
  marker:         { fontSize: 10, marginTop: 1 },
  blurredCell:    { backgroundColor: '#1a1035', borderColor: 'rgba(124,58,237,0.15)' },
  blurredText:    { color: 'rgba(255,255,255,0.2)' },
  lockOverlay:    { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
  lockIcon:       { fontSize: 10 },
})
