import { supabase } from '../lib/supabase'
import type { AuspiciousDay, GetMonthlyDaysParams, EventType } from '../types/calendar'

export const auspiciousCalendarService = {
  async getMonthlyDays(params: GetMonthlyDaysParams): Promise<AuspiciousDay[]> {
    const { data, error } = await supabase.functions.invoke('calculate-auspicious-days', {
      body: params,
    })
    if (error) throw error
    return data.data as AuspiciousDay[]
  },

  async getDayInterpretation(
    _userId: string,
    day: AuspiciousDay,
    eventType: EventType,
    _sajuData: Record<string, unknown>,
    _language: string
  ) {
    // TODO: deploy ai-calendar-interpretation edge function and replace with real call
    const eventLabels: Record<EventType, string> = {
      wedding: '결혼',
      moving: '이사',
      contract: '계약',
      interview: '면접',
    }
    const label = eventLabels[eventType]
    return {
      summary: `${label}에 ${day.status === 'lucky' ? '좋은' : '보통인'} 날입니다.`,
      reason: day.status === 'lucky'
        ? '천간과 지지의 오행이 상생하여 길한 기운이 강합니다.'
        : '오행의 흐름이 중화로 무난합니다.',
      advice: day.status === 'lucky'
        ? '오전 중 진행하시면 더욱 좋습니다.'
        : '신중하게 검토 후 진행하세요.',
      luckyColor: '흰색',
      luckyTime: '오전 9–11시',
    }
  },
}
