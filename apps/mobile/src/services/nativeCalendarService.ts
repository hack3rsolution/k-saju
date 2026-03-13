// expo-calendar temporarily removed to unblock development.
// MissingCalendarPListValueException was preventing app launch.
// All methods return stubs until expo-calendar is re-added properly.
// TODO: restore full implementation after core calendar UI is verified.

import * as Notifications from 'expo-notifications'
import dayjs from 'dayjs'
import type { AuspiciousDay, EventType } from '../types/calendar'

const EVENT_LABELS: Record<EventType, string> = {
  wedding:   '결혼 길일',
  moving:    '이사 길일',
  contract:  '계약 길일',
  interview: '면접 길일',
}

export const nativeCalendarService = {
  async requestPermissions(): Promise<boolean> {
    return Promise.resolve(true)
  },

  async addAuspiciousDay(_day: AuspiciousDay, _eventType: EventType): Promise<string> {
    return Promise.resolve('mock-event-id')
  },

  async scheduleNotifications(
    day: AuspiciousDay,
    eventType: EventType
  ): Promise<string[]> {
    const DAYS_BEFORE = [7, 3, 1]
    const ids: string[] = []

    try {
      for (const d of DAYS_BEFORE) {
        const triggerDate = dayjs(day.date).subtract(d, 'day').toDate()
        if (triggerDate <= new Date()) continue

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 ${d}일 후가 ${EVENT_LABELS[eventType]}이에요`,
            body:   day.interpretation?.summary ?? '오늘의 운세를 확인하세요',
            data:   { screen: 'Calendar', date: day.date, eventType },
          },
          trigger: { date: triggerDate },
        })
        ids.push(id)
    }
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e))
    }

    return ids
  },
}
