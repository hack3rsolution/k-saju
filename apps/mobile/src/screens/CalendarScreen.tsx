import React, { useState } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { T } from '../theme/tokens'
import { ScreenHeader } from '../components/ScreenHeader'
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
      <View style={styles.headerArea}>
        <ScreenHeader
          title={t('calendar.screenTitle')}
          subtitle={t('calendar.subtitle')}
        />
      </View>

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
        onUpgradePress={onUpgradePress}
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
  container:  { flex: 1, backgroundColor: T.bg.surface },
  headerArea: { paddingHorizontal: T.spacing[6], paddingTop: 60 },
})
