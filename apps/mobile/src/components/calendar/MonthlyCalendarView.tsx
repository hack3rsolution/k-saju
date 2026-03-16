import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { DayCell } from './DayCell'
import type { AuspiciousDay, DayStatus } from '../../types/calendar'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Free users: today + next 6 days (7 days total), 8+ days in the future are blurred
const FREE_WINDOW_DAYS = 7

interface Props {
  month: string           // 'YYYY-MM'
  days: AuspiciousDay[]
  isLoading: boolean
  onDayPress: (day: AuspiciousDay) => void
  onMonthChange: (month: string) => void
  isPremium?: boolean
  onUpgradePress?: () => void
}

export function MonthlyCalendarView({ month, days, isLoading, onDayPress, onMonthChange, isPremium = false, onUpgradePress }: Props) {
  const { t } = useTranslation('common')
  const current = dayjs(month)
  const today   = dayjs().format('YYYY-MM-DD')
  // Last free day (inclusive): today + 6
  const freeEndDate = dayjs().add(FREE_WINDOW_DAYS - 1, 'day').format('YYYY-MM-DD')

  // Free 유저: lucky 날 상위 3개 이외는 neutral로 표시
  const visibleStatusMap = useMemo<Record<string, DayStatus>>(() => {
    if (isPremium) return {}
    const luckyDays = days
      .filter(d => d.status === 'lucky')
      .sort((a, b) => b.score - a.score)
    const top3 = new Set(luckyDays.slice(0, 3).map(d => d.date))
    const map: Record<string, DayStatus> = {}
    days.forEach(d => {
      if (d.status === 'lucky' && !top3.has(d.date)) {
        map[d.date] = 'neutral'
      }
    })
    return map
  }, [days, isPremium])

  // dayjs 그리드 생성 (이전달 빈 칸 포함)
  const firstDayOfMonth = current.startOf('month').day() // 0=일
  const daysInMonth     = current.daysInMonth()

  const dayMap = useMemo(() => {
    const m: Record<string, AuspiciousDay> = {}
    days.forEach(d => { m[d.date] = d })
    return m
  }, [days])

  const cells: Array<{ date: string; isCurrentMonth: boolean }> = []

  // 이전 달 빈 칸
  const prevMonth = current.subtract(1, 'month')
  const prevDays  = prevMonth.daysInMonth()
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ date: prevMonth.format(`YYYY-MM-${String(prevDays - i).padStart(2, '0')}`), isCurrentMonth: false })
  }

  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: current.format(`YYYY-MM-${String(d).padStart(2, '0')}`), isCurrentMonth: true })
  }

  // 다음 달 빈 칸 (6행 채우기)
  const nextMonth = current.add(1, 'month')
  let nd = 1
  while (cells.length % 7 !== 0) {
    cells.push({ date: nextMonth.format(`YYYY-MM-${String(nd).padStart(2, '0')}`), isCurrentMonth: false })
    nd++
  }

  // 주 단위로 분할
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <View style={styles.container}>
      {/* 월 네비게이션 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onMonthChange(current.subtract(1, 'month').format('YYYY-MM'))} style={styles.navBtn}>
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{current.format('YYYY년 M월')}</Text>
        <TouchableOpacity onPress={() => onMonthChange(current.add(1, 'month').format('YYYY-MM'))} style={styles.navBtn}>
          <Text style={styles.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map(wd => (
          <Text key={wd} style={[styles.weekday, wd === '일' && styles.sunday, wd === '토' && styles.saturday]}>
            {wd}
          </Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map(cell => {
              const dayData = dayMap[cell.date] ?? {
                date: cell.date, score: 50, status: 'neutral' as DayStatus,
                heavenlyStem: '', earthlyBranch: '',
              }
              const isBlurred = !isPremium && cell.isCurrentMonth && cell.date > freeEndDate
              return (
                <DayCell
                  key={cell.date}
                  day={dayData}
                  isToday={cell.date === today}
                  isCurrentMonth={cell.isCurrentMonth}
                  onPress={isBlurred ? () => onUpgradePress?.() : onDayPress}
                  visibleStatus={visibleStatusMap[cell.date]}
                  isBlurred={isBlurred}
                />
              )
            })}
          </View>
        ))
      )}

      {/* 프리미엄 업그레이드 배너 (Free 유저 전용) */}
      {!isPremium && (
        <View style={styles.upgradeBanner}>
          <Text style={styles.bannerText}>{t('calendar.premiumRequired')}</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={onUpgradePress}>
            <Text style={styles.bannerBtnText}>{t('calendar.upgradeNow')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, paddingHorizontal: 12 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  navBtn:           { padding: 8 },
  navText:          { fontSize: 20, color: '#a78bfa', fontWeight: '700' },
  monthTitle:       { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  weekdayRow:       { flexDirection: 'row', marginBottom: 4 },
  weekday:          { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9d8fbe' },
  sunday:           { color: '#f87171' },
  saturday:         { color: '#7dd3fc' },
  week:             { flexDirection: 'row' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, marginHorizontal: 4, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  bannerText:    { flex: 1, fontSize: 12, color: '#c4b5fd', marginRight: 8 },
  bannerBtn:     { backgroundColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  bannerBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})
