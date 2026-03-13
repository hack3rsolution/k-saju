export type EventType = 'wedding' | 'moving' | 'contract' | 'interview'

export type DayStatus = 'lucky' | 'neutral' | 'unlucky'

export interface DayInterpretation {
  summary:    string   // 한줄 요약 (20자 이내)
  reason:     string   // 길흉 이유 (60자 이내)
  advice:     string   // 구체적 조언 (80자 이내)
  luckyColor: string   // 오방색 기반 추천색 이름
  luckyTime:  string   // 추천 시간대 (예: "오전 9–11시")
}

export interface AuspiciousDay {
  date:           string            // 'YYYY-MM-DD'
  score:          number            // 0–100
  status:         DayStatus
  heavenlyStem:   string            // 천간: 甲乙丙丁戊己庚辛壬癸
  earthlyBranch:  string            // 지지: 子丑寅卯辰巳午未申酉戌亥
  lunarDate?:     string            // 음력 날짜 표시용
  interpretation?: DayInterpretation
}

export interface CalendarState {
  selectedMonth:     string          // 'YYYY-MM'
  selectedEventType: EventType
  days:              AuspiciousDay[]
  selectedDay:       AuspiciousDay | null
  isLoading:         boolean
  error:             string | null
}

export interface GetMonthlyDaysParams {
  userId:     string
  yearMonth:  string
  eventType:  EventType
  sajuData:   Record<string, unknown>
  language:   string
}
