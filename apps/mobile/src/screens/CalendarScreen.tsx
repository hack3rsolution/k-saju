import React, { useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import dayjs from 'dayjs'
import { useAuspiciousDays } from '../hooks/useAuspiciousDays'
import { useIsPremium } from '../store/entitlementStore'
import { EventTypePicker } from '../components/calendar/EventTypePicker'
import { MonthlyCalendarView } from '../components/calendar/MonthlyCalendarView'
import { DayDetailModal } from '../components/calendar/DayDetailModal'
import type { EventType } from '../types/calendar'

interface Props {
  onUpgradePress?: () => void
}

export default function CalendarScreen({ onUpgradePress }: Props) {
  const [month, setMonth]         = useState(dayjs().format('YYYY-MM'))
  const [eventType, setEventType] = useState<EventType>('wedding')
  const isPremium = useIsPremium()

  const { days, selectedDay, selectDay, fetchInterpretation, isLoading } =
    useAuspiciousDays(month, eventType)

  return (
    <SafeAreaView style={styles.container}>
      <EventTypePicker
        selected={eventType}
        onSelect={setEventType}
        isPremium={isPremium}
        onUpgradePress={onUpgradePress}
      />

      <MonthlyCalendarView
        month={month}
        days={days}
        isLoading={isLoading}
        isPremium={isPremium}
        onDayPress={(day) => {
          selectDay(day)
          if (!day.interpretation) fetchInterpretation(day)
        }}
        onMonthChange={setMonth}
      />

      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          eventType={eventType}
          isPremium={isPremium}
          onClose={() => selectDay(null)}
          onUpgradePress={onUpgradePress}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F1' },
})
