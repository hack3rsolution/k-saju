import { useState, useEffect, useCallback } from 'react'
import {
  calculateFourPillars,
  calculateElementBalance,
  calculateDaewoon,
  STEM_ELEMENT,
  type BirthData,
  type FiveElement,
  type CulturalFrame,
} from '@k-saju/saju-engine'
import { useAuthStore } from '../store/authStore'
import { useSajuStore } from '../store/sajuStore'
import { useLanguageStore } from '../store/languageStore'
import { auspiciousCalendarService } from '../services/auspiciousCalendarService'
import type { AuspiciousDay, CalendarState, EventType } from '../types/calendar'

export function useAuspiciousDays(month: string, eventType: EventType) {
  const { user, session } = useAuthStore()
  const { chart, setChart } = useSajuStore()
  const { language } = useLanguageStore()

  const [state, setState] = useState<CalendarState>({
    selectedMonth:     month,
    selectedEventType: eventType,
    days:              [],
    selectedDay:       null,
    isLoading:         false,
    error:             null,
  })

  const fetchDays = useCallback(async () => {
    if (!user) return

    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      // ── 차트가 store에 없으면 user_metadata에서 재구성 (cold start 대응) ─────
      let activeChart = chart
      if (!activeChart && session) {
        const meta = session.user.user_metadata
        if (meta?.birth_year) {
          const birthData: BirthData = {
            year:   meta.birth_year,
            month:  meta.birth_month,
            day:    meta.birth_day,
            hour:   meta.birth_hour ?? undefined,
            gender: (meta.gender as 'M' | 'F') ?? 'M',
          }
          const pillars  = calculateFourPillars(birthData)
          const elements = calculateElementBalance(pillars)
          const daewoon  = calculateDaewoon(birthData)
          activeChart = {
            pillars,
            elements,
            dayStem:    pillars.day.stem,
            dayElement: STEM_ELEMENT[pillars.day.stem] as FiveElement,
          }
          setChart(activeChart, birthData, daewoon, (meta.cultural_frame as string ?? 'en') as CulturalFrame)
        }
      }

      if (!activeChart) {
        setState(s => ({ ...s, isLoading: false, error: 'Chart not found. Please complete onboarding.' }))
        return
      }

      // ElementBalance: saju-engine → English keys (Wood/Fire/…) → lowercase for Edge Function
      const sajuData: Record<string, unknown> = {
        elements: {
          wood:  activeChart.elements.Wood,
          fire:  activeChart.elements.Fire,
          earth: activeChart.elements.Earth,
          metal: activeChart.elements.Metal,
          water: activeChart.elements.Water,
        },
      }

      const days = await auspiciousCalendarService.getMonthlyDays({
        userId:    user.id,
        yearMonth: month,
        eventType,
        sajuData,
        language,
      })
      setState(s => ({ ...s, days, isLoading: false }))
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: String(e) }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token, month, eventType, language])

  useEffect(() => { fetchDays() }, [fetchDays])

  const selectDay = useCallback((day: AuspiciousDay | null) => {
    setState(s => ({ ...s, selectedDay: day }))
  }, [])

  const fetchInterpretation = useCallback(async (day: AuspiciousDay) => {
    if (!user) return
    try {
      const activeChart = chart
      const sajuData: Record<string, unknown> = activeChart
        ? {
            elements: {
              wood:  activeChart.elements.Wood,
              fire:  activeChart.elements.Fire,
              earth: activeChart.elements.Earth,
              metal: activeChart.elements.Metal,
              water: activeChart.elements.Water,
            },
          }
        : {}

      const interp = await auspiciousCalendarService.getDayInterpretation(
        user.id, day, eventType, sajuData, language
      )
      setState(s => ({
        ...s,
        days: s.days.map(d => d.date === day.date ? { ...d, interpretation: interp } : d),
        selectedDay: s.selectedDay?.date === day.date
          ? { ...s.selectedDay, interpretation: interp }
          : s.selectedDay,
      }))
    } catch (e) {
      console.warn('[useAuspiciousDays] fetchInterpretation failed:', e)
    }
  }, [user, chart, eventType, language])

  return { ...state, refetch: fetchDays, selectDay, fetchInterpretation }
}
