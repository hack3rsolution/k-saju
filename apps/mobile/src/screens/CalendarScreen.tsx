import React, { useState } from 'react'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('common')
  const [month, setMonth]         = useState(dayjs().format('YYYY-MM'))
  const [eventType, setEventType] = useState<EventType>('wedding')
  const isPremium = useIsPremium()

  const { days, selectedDay, selectDay, fetchInterpretation, isLoading } =
    useAuspiciousDays(month, eventType)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('calendar.screenTitle')}</Text>
        <Text style={styles.subtitle}>{t('calendar.subtitle')}</Text>
      </View>

      <View style={styles.content}>
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
      </View>

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
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#1a0a2e',
  },
  title:    { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#9d8fbe' },
  content:  { flex: 1, backgroundColor: '#FAF6F1' },
})
