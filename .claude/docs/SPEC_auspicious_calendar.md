# SPEC: 길일/흉일 캘린더 (Auspicious Day Calendar)

> **Feature ID:** FEAT-CAL-001
> **브랜치:** `feat/auspicious-calendar` (main에서 분기)
> **예상 소요:** 2–3주 스프린트
> **연계 문서:** `CLAUDE.md` (프로젝트 전역 컨텍스트)

---

## 목차

1. [기능 정의](#1-기능-정의)
2. [아키텍처 및 파일 구조](#2-아키텍처-및-파일-구조)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [타입 정의](#4-타입-정의)
5. [Edge Functions](#5-edge-functions)
6. [서비스 레이어](#6-서비스-레이어)
7. [커스텀 훅](#7-커스텀-훅)
8. [UI 컴포넌트](#8-ui-컴포넌트)
9. [네이티브 캘린더 연동](#9-네이티브-캘린더-연동)
10. [i18n 키](#10-i18n-키)
11. [프리미엄 잠금 전략](#11-프리미엄-잠금-전략)
12. [Claude Code Task 목록](#12-claude-code-task-목록)
13. [검증 체크리스트](#13-검증-체크리스트)

---

## 1. 기능 정의

사용자의 사주(四柱) 데이터를 기반으로 **이달의 길일(吉日)/흉일(凶日)**을 계산하고,
결혼·이사·계약·면접 등 삶의 중요 이벤트에 최적의 날을 추천하는 캘린더 기능.

### 핵심 기능

- **이달 길흉일 캘린더** — 60갑자 일진 + 개인 사주 오행 분석 기반 점수 계산
- **이벤트 타입별 추천** — 결혼 💍 / 이사 🏠 / 계약 📝 / 면접 💼
- **AI 상세 해석** — Claude가 길흉 이유, 조언, 행운색, 추천 시간대 제공
- **네이티브 캘린더 추가** — iOS EventKit / Android CalendarProvider 연동
- **자동 알림** — D-7, D-3, D-1 푸시 알림 예약

---

## 2. 아키텍처 및 파일 구조

```
데이터 흐름:
사주 엔진 → calculate-auspicious-days (Edge Fn)
         → ai-calendar-interpretation (Edge Fn + Claude API)
         → CalendarScreen (React Native)
         → nativeCalendarService (expo-calendar)
         → schedule-calendar-notifications (Edge Fn)
```

### 신규 생성 파일 목록

```
apps/mobile/src/
├── screens/
│   └── CalendarScreen.tsx
├── components/calendar/
│   ├── MonthlyCalendarView.tsx
│   ├── DayCell.tsx
│   ├── DayDetailModal.tsx
│   ├── EventTypePicker.tsx
│   └── CalendarExportModal.tsx
├── hooks/
│   ├── useAuspiciousDays.ts
│   └── useCalendarExport.ts
├── services/
│   ├── auspiciousCalendarService.ts
│   └── nativeCalendarService.ts
└── types/
    └── calendar.ts

supabase/
├── migrations/
│   └── 20260311000001_auspicious_calendar.sql
└── functions/
    ├── calculate-auspicious-days/
    │   └── index.ts
    ├── ai-calendar-interpretation/
    │   └── index.ts
    └── schedule-calendar-notifications/
        └── index.ts
```

---

## 3. 데이터베이스 스키마

**파일:** `supabase/migrations/20260311000001_auspicious_calendar.sql`

```sql
-- 길흉일 계산 결과 캐시
CREATE TABLE auspicious_days_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month    TEXT NOT NULL,        -- 'YYYY-MM'
  event_type    TEXT NOT NULL,        -- 'wedding'|'moving'|'contract'|'interview'
  language      TEXT NOT NULL DEFAULT 'ko',
  days_data     JSONB NOT NULL,
  saju_hash     TEXT NOT NULL,        -- 사주 변경 감지용 MD5 해시
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(user_id, year_month, event_type, language)
);

-- 캘린더 알림 예약
CREATE TABLE calendar_notifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date          DATE NOT NULL,
  event_type           TEXT NOT NULL,
  notify_days_before   INTEGER[] DEFAULT '{1,3,7}',
  native_event_id      TEXT,          -- 네이티브 캘린더에 저장된 이벤트 ID
  expo_notification_ids TEXT[],       -- 예약된 푸시 알림 ID 배열
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE auspicious_days_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_cache"
  ON auspicious_days_cache FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_notifications"
  ON calendar_notifications FOR ALL USING (auth.uid() = user_id);

-- 만료된 캐시 자동 정리 인덱스
CREATE INDEX idx_cache_expires ON auspicious_days_cache(expires_at);
CREATE INDEX idx_cache_lookup  ON auspicious_days_cache(user_id, year_month, event_type, language);
```

---

## 4. 타입 정의

**파일:** `apps/mobile/src/types/calendar.ts`

```typescript
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
```

---

## 5. Edge Functions

### 5.1 `calculate-auspicious-days`

**파일:** `supabase/functions/calculate-auspicious-days/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 이벤트별 오행 가중치
const EVENT_WEIGHTS: Record<string, Record<string, number>> = {
  wedding:   { wood: 1.4, fire: 1.3, earth: 1.2, metal: 0.8, water: 1.0 },
  moving:    { wood: 1.2, fire: 1.0, earth: 1.4, metal: 1.1, water: 0.9 },
  contract:  { wood: 1.0, fire: 1.1, earth: 1.3, metal: 1.5, water: 1.2 },
  interview: { wood: 1.1, fire: 1.4, earth: 1.0, metal: 1.3, water: 1.2 },
}

// 60갑자 천간 (10개)
const HEAVENLY_STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
// 60갑자 지지 (12개)
const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

// 기준일: 2024-01-01 = 甲子日 (index 0)
const BASE_DATE = new Date('2024-01-01')
const BASE_GANJJI_INDEX = 0 // 甲子

function getGanjiForDate(dateStr: string) {
  const date = new Date(dateStr)
  const diffDays = Math.floor((date.getTime() - BASE_DATE.getTime()) / 86400000)
  const idx = ((BASE_GANJJI_INDEX + diffDays) % 60 + 60) % 60
  return {
    heavenlyStem:  HEAVENLY_STEMS[idx % 10],
    earthlyBranch: EARTHLY_BRANCHES[idx % 12],
    ganjiIndex:    idx,
  }
}

function computeSajuHash(sajuData: unknown): string {
  const str = JSON.stringify(sajuData)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function calculateDayScore(
  ganjiIndex: number,
  sajuData: Record<string, unknown>,
  weights: Record<string, number>
): number {
  // 사주 오행 점수 (sajuData.elements 기반)
  const elements = (sajuData.elements as Record<string, number>) ?? {}
  const elementScore =
    (elements.wood  ?? 20) * weights.wood  +
    (elements.fire  ?? 20) * weights.fire  +
    (elements.earth ?? 20) * weights.earth +
    (elements.metal ?? 20) * weights.metal +
    (elements.water ?? 20) * weights.water

  // 일진 순환 보정 (60갑자 중 길한 간지 가중)
  const luckyGanji = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54] // 甲子, 甲午...
  const ganjiBonus = luckyGanji.includes(ganjiIndex) ? 15 : 0

  return Math.min(100, Math.round(elementScore / 5 + ganjiBonus))
}

function getDaysInMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const days: string[] = []
  const lastDay = new Date(year, month, 0).getDate()
  for (let d = 1; d <= lastDay; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, '0')}`)
  }
  return days
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, yearMonth, eventType, sajuData, language } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. 캐시 확인
    const sajuHash = computeSajuHash(sajuData)
    const { data: cached } = await supabase
      .from('auspicious_days_cache')
      .select('days_data')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .eq('event_type', eventType)
      .eq('language', language)
      .eq('saju_hash', sajuHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      return Response.json({ data: cached.days_data, cached: true }, { headers: corsHeaders })
    }

    // 2. 일진 계산
    const days = getDaysInMonth(yearMonth)
    const weights = EVENT_WEIGHTS[eventType] ?? EVENT_WEIGHTS.wedding
    const dailyScores = days.map(date => {
      const ganji = getGanjiForDate(date)
      return {
        date,
        score: calculateDayScore(ganji.ganjiIndex, sajuData, weights),
        heavenlyStem:  ganji.heavenlyStem,
        earthlyBranch: ganji.earthlyBranch,
        status: 'neutral' as const,
      }
    })

    // 3. 상위 30% → 길일 / 하위 20% → 흉일
    const sorted = [...dailyScores].sort((a, b) => b.score - a.score)
    const luckyThreshold    = sorted[Math.floor(sorted.length * 0.30)].score
    const unluckyThreshold  = sorted[Math.floor(sorted.length * 0.80)].score

    const result = dailyScores.map(d => ({
      ...d,
      status: d.score >= luckyThreshold  ? 'lucky'
             : d.score <= unluckyThreshold ? 'unlucky'
             : 'neutral',
    }))

    // 4. 캐시 저장
    await supabase.from('auspicious_days_cache').upsert({
      user_id:    userId,
      year_month: yearMonth,
      event_type: eventType,
      language,
      days_data:  result,
      saju_hash:  sajuHash,
    })

    return Response.json({ data: result, cached: false }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
```

---

### 5.2 `ai-calendar-interpretation`

**파일:** `supabase/functions/ai-calendar-interpretation/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, date, dayData, eventType, sajuData, language } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 캐시 키 — language 코드 반드시 포함
    const cacheKey = `cal_interp:${userId}:${date}:${eventType}:${language}`

    const { data: cached } = await supabase
      .from('ai_content_cache')
      .select('content')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      return Response.json({ data: JSON.parse(cached.content), cached: true }, { headers: corsHeaders })
    }

    const EVENT_LABELS: Record<string, string> = {
      wedding: '결혼', moving: '이사', contract: '계약', interview: '면접',
    }

    const systemPrompt = `당신은 한국 전통 사주 명리학 전문가입니다.
사주 데이터를 분석하여 ${language} 언어로 길일/흉일 해석을 제공합니다.
반드시 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 반환합니다.`

    const userPrompt = `
날짜: ${date}
천간: ${dayData.heavenlyStem} / 지지: ${dayData.earthlyBranch}
이벤트: ${EVENT_LABELS[eventType] ?? eventType}
길흉: ${dayData.status} (점수: ${dayData.score}/100)
사주 오행: ${JSON.stringify(sajuData.elements ?? {})}

다음 JSON 형식으로 해석해주세요:
{
  "summary":    "한줄 요약 (20자 이내, ${language})",
  "reason":     "길흉 이유 (60자 이내, ${language})",
  "advice":     "구체적 조언 (80자 이내, ${language})",
  "luckyColor": "오방색 기반 추천색 이름 (${language})",
  "luckyTime":  "추천 시간대 (${language})"
}`

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const interpretation = JSON.parse(text)

    // 캐시 저장 (7일)
    await supabase.from('ai_content_cache').upsert({
      cache_key:  cacheKey,
      content:    JSON.stringify(interpretation),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return Response.json({ data: interpretation, cached: false }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
```

---

### 5.3 배포 명령어

```bash
cd ~/Projects/k-saju

# DB 마이그레이션 먼저
supabase db push

# Edge Functions 배포 (--no-verify-jwt 필수)
supabase functions deploy calculate-auspicious-days --no-verify-jwt
supabase functions deploy ai-calendar-interpretation --no-verify-jwt
supabase functions deploy schedule-calendar-notifications --no-verify-jwt

# 배포 확인
supabase functions list
```

---

## 6. 서비스 레이어

**파일:** `apps/mobile/src/services/auspiciousCalendarService.ts`

```typescript
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
    userId: string,
    day: AuspiciousDay,
    eventType: EventType,
    sajuData: Record<string, unknown>,
    language: string
  ) {
    const { data, error } = await supabase.functions.invoke('ai-calendar-interpretation', {
      body: { userId, date: day.date, dayData: day, eventType, sajuData, language },
    })
    if (error) throw error
    return data.data
  },
}
```

---

## 7. 커스텀 훅

**파일:** `apps/mobile/src/hooks/useAuspiciousDays.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { useAuth } from './useAuth'
import { auspiciousCalendarService } from '../services/auspiciousCalendarService'
import type { AuspiciousDay, CalendarState, EventType } from '../types/calendar'

export function useAuspiciousDays(month: string, eventType: EventType) {
  const { user, sajuData } = useAuth()
  const [state, setState] = useState<CalendarState>({
    selectedMonth:     month,
    selectedEventType: eventType,
    days:              [],
    selectedDay:       null,
    isLoading:         false,
    error:             null,
  })

  const fetchDays = useCallback(async () => {
    if (!user || !sajuData) return
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const days = await auspiciousCalendarService.getMonthlyDays({
        userId:    user.id,
        yearMonth: month,
        eventType,
        sajuData,
        language:  user.language ?? 'ko',
      })
      setState(s => ({ ...s, days, isLoading: false }))
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: String(e) }))
    }
  }, [user, sajuData, month, eventType])

  useEffect(() => { fetchDays() }, [fetchDays])

  const selectDay = useCallback((day: AuspiciousDay | null) => {
    setState(s => ({ ...s, selectedDay: day }))
  }, [])

  const fetchInterpretation = useCallback(async (day: AuspiciousDay) => {
    if (!user || !sajuData) return
    const interp = await auspiciousCalendarService.getDayInterpretation(
      user.id, day, eventType, sajuData, user.language ?? 'ko'
    )
    setState(s => ({
      ...s,
      days: s.days.map(d => d.date === day.date ? { ...d, interpretation: interp } : d),
      selectedDay: s.selectedDay?.date === day.date
        ? { ...s.selectedDay, interpretation: interp }
        : s.selectedDay,
    }))
  }, [user, sajuData, eventType])

  return { ...state, refetch: fetchDays, selectDay, fetchInterpretation }
}
```

---

## 8. UI 컴포넌트

### 8.1 CalendarScreen (메인 화면)

**파일:** `apps/mobile/src/screens/CalendarScreen.tsx`

```typescript
import React, { useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import dayjs from 'dayjs'
import { useAuspiciousDays } from '../hooks/useAuspiciousDays'
import { EventTypePicker } from '../components/calendar/EventTypePicker'
import { MonthlyCalendarView } from '../components/calendar/MonthlyCalendarView'
import { DayDetailModal } from '../components/calendar/DayDetailModal'
import type { EventType } from '../types/calendar'

export default function CalendarScreen() {
  const [month, setMonth]           = useState(dayjs().format('YYYY-MM'))
  const [eventType, setEventType]   = useState<EventType>('wedding')
  const { days, selectedDay, selectDay, fetchInterpretation, isLoading } =
    useAuspiciousDays(month, eventType)

  return (
    <SafeAreaView style={styles.container}>
      <EventTypePicker selected={eventType} onSelect={setEventType} />

      <MonthlyCalendarView
        month={month}
        days={days}
        isLoading={isLoading}
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
          onClose={() => selectDay(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F1' },
})
```

### 8.2 DayCell (오방색 상태 표시)

**파일:** `apps/mobile/src/components/calendar/DayCell.tsx`

```typescript
// DayStatus별 오방색 매핑
const STATUS_STYLE = {
  lucky:   { bg: '#E8F5E9', border: '#4CAF50', marker: '🌟' },  // 木 (녹)
  neutral: { bg: '#FFFFFF', border: '#E0E0E0', marker: ''   },  // 土 (회)
  unlucky: { bg: '#FFEBEE', border: '#E53935', marker: '⚠️'  },  // 水 (적)
}

// Free 유저: 길일 상위 3개만 표시, 나머지는 neutral로 렌더링
// isPremium이 false이면 lucky 상태를 index 3 이후부터 neutral로 덮어씌움
```

### 8.3 EventTypePicker

```typescript
const EVENT_CONFIG = [
  { type: 'wedding',   label: '결혼', emoji: '💍', premiumOnly: false },
  { type: 'moving',    label: '이사', emoji: '🏠', premiumOnly: true  },
  { type: 'contract',  label: '계약', emoji: '📝', premiumOnly: true  },
  { type: 'interview', label: '면접', emoji: '💼', premiumOnly: true  },
] as const

// Free 유저가 premiumOnly 탭 탭하면 → Premium 업셀 바텀시트 표시
// 기존 Weekly Fortune의 BlurUpgradeOverlay 컴포넌트 재사용
```

---

## 9. 네이티브 캘린더 연동

### 9.1 패키지 설치

```bash
pnpm --filter mobile add expo-calendar expo-notifications
```

### 9.2 app.json 권한 추가

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCalendarsUsageDescription": "사주 길일을 캘린더에 저장합니다",
        "NSCalendarsFullAccessUsageDescription": "길일/흉일을 캘린더에 추가합니다"
      }
    },
    "android": {
      "permissions": ["READ_CALENDAR", "WRITE_CALENDAR", "RECEIVE_BOOT_COMPLETED"]
    }
  }
}
```

### 9.3 nativeCalendarService

**파일:** `apps/mobile/src/services/nativeCalendarService.ts`

```typescript
import * as Calendar      from 'expo-calendar'
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
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    return status === 'granted'
  },

  async addAuspiciousDay(day: AuspiciousDay, eventType: EventType): Promise<string> {
    const granted = await this.requestPermissions()
    if (!granted) throw new Error('Calendar permission denied')

    const defaultCalendar = await Calendar.getDefaultCalendarAsync()
    const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
      title:     `🌟 ${EVENT_LABELS[eventType]}`,
      notes:     day.interpretation?.advice ?? '',
      startDate: new Date(`${day.date}T09:00:00`),
      endDate:   new Date(`${day.date}T23:59:00`),
      allDay:    true,
      alarms:    [{ relativeOffset: -1440 }],   // 1일 전 알림
    })
    return eventId
  },

  async scheduleNotifications(
    day: AuspiciousDay,
    eventType: EventType
  ): Promise<string[]> {
    const DAYS_BEFORE = [7, 3, 1]
    const ids: string[] = []

    for (const d of DAYS_BEFORE) {
      const triggerDate = dayjs(day.date).subtract(d, 'day').toDate()
      if (triggerDate <= new Date()) continue

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 ${d}일 후가 ${EVENT_LABELS[eventType]}이에요`,
          body:   day.interpretation?.summary ?? '오늘의 운세를 확인하세요',
          data:   { screen: 'Calendar', date: day.date, eventType },
        },
        trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
      })
      ids.push(id)
    }
    return ids
  },
}
```

---

## 10. i18n 키

다음 키를 15개 언어 번역 파일 모두에 추가:

```json
{
  "calendar": {
    "title":           "이달의 길일",
    "lucky":           "길일",
    "unlucky":         "흉일",
    "neutral":         "보통",
    "eventTypes": {
      "wedding":       "결혼",
      "moving":        "이사",
      "contract":      "계약",
      "interview":     "면접"
    },
    "addToCalendar":   "캘린더에 추가",
    "setNotification": "알림 설정",
    "notifyBefore":    "D-{days}일 전 알림",
    "heavenlyStem":    "천간",
    "earthlyBranch":   "지지",
    "luckyColor":      "행운색",
    "luckyTime":       "추천 시간",
    "premiumRequired": "Premium에서 전체 길일을 확인하세요",
    "upgradeNow":      "업그레이드"
  }
}
```

---

## 11. 프리미엄 잠금 전략

| 기능 | Free | Premium |
|------|------|---------|
| 이달 길일 상위 3개 미리보기 | ✅ | ✅ |
| 전체 길일/흉일 캘린더 | 🔒 블러 | ✅ |
| 이벤트 타입 (결혼만) | ✅ | ✅ |
| 이벤트 타입 (이사/계약/면접) | 🔒 탭 잠금 | ✅ |
| AI 상세 해석 | 🔒 블러 | ✅ |
| 네이티브 캘린더 추가 | 🔒 | ✅ |
| D-7/3/1 푸시 알림 | 🔒 | ✅ |
| 음력/양력 전환 | ✅ | ✅ |

> **구현 패턴:** 기존 `WeeklyFortuneScreen`의 `BlurUpgradeOverlay` 컴포넌트 재사용

---

## 12. Claude Code Task 목록

> 아래 Task를 **순서대로** Claude Code에 붙여넣어 실행하세요.
> 각 Task 완료 후 `pnpm --filter mobile tsc --noEmit` 으로 타입 오류 없음을 확인한 뒤 다음 Task로 진행합니다.

---

### ✅ TASK 0 — 브랜치 생성

```
cd ~/Projects/k-saju
git checkout main && git pull
git checkout -b feat/auspicious-calendar
```

---

### ✅ TASK 1 — DB 마이그레이션 및 스키마 적용

```
K-Saju Global 프로젝트(~/Projects/k-saju)에서 다음 작업을 수행해주세요.

1. `supabase/migrations/20260311000001_auspicious_calendar.sql` 파일을 생성하세요.
   SPEC_auspicious_calendar.md 섹션 3의 SQL을 그대로 사용합니다.

2. 마이그레이션을 적용합니다:
   supabase db push

3. Supabase 대시보드에서 두 테이블이 생성됐는지 확인합니다:
   - auspicious_days_cache
   - calendar_notifications

완료 후 `supabase db diff`를 실행해 변경사항을 출력해주세요.
```

---

### ✅ TASK 2 — Edge Function: calculate-auspicious-days

```
K-Saju Global 프로젝트(~/Projects/k-saju)에서 다음 작업을 수행해주세요.

1. `supabase/functions/calculate-auspicious-days/index.ts`를 생성하세요.
   SPEC_auspicious_calendar.md 섹션 5.1의 코드를 사용합니다.

2. 함수를 배포합니다 (--no-verify-jwt 필수):
   supabase functions deploy calculate-auspicious-days --no-verify-jwt

3. 배포 후 간단히 curl 테스트합니다:
   curl -X POST "$SUPABASE_URL/functions/v1/calculate-auspicious-days" \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","yearMonth":"2026-03","eventType":"wedding","sajuData":{"elements":{"wood":25,"fire":20,"earth":20,"metal":20,"water":15}},"language":"ko"}'

4. HTTP 200 응답과 `data` 배열을 확인해주세요.
```

---

### ✅ TASK 3 — Edge Function: ai-calendar-interpretation

```
K-Saju Global 프로젝트(~/Projects/k-saju)에서 다음 작업을 수행해주세요.

1. `supabase/functions/ai-calendar-interpretation/index.ts`를 생성하세요.
   SPEC_auspicious_calendar.md 섹션 5.2의 코드를 사용합니다.

2. 함수를 배포합니다 (--no-verify-jwt 필수):
   supabase functions deploy ai-calendar-interpretation --no-verify-jwt

3. 배포 후 테스트합니다:
   curl -X POST "$SUPABASE_URL/functions/v1/ai-calendar-interpretation" \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","date":"2026-03-15","dayData":{"heavenlyStem":"甲","earthlyBranch":"子","score":85,"status":"lucky"},"eventType":"wedding","sajuData":{"elements":{"wood":25,"fire":20,"earth":20,"metal":20,"water":15}},"language":"ko"}'

4. JSON 응답에 summary, reason, advice, luckyColor, luckyTime 필드가 모두 있는지 확인합니다.
```

---

### ✅ TASK 4 — 타입 정의 및 서비스 레이어

```
K-Saju Global 모바일 앱(apps/mobile)에서 다음 파일들을 생성해주세요.

1. `apps/mobile/src/types/calendar.ts`
   SPEC_auspicious_calendar.md 섹션 4의 타입 정의를 사용합니다.

2. `apps/mobile/src/services/auspiciousCalendarService.ts`
   SPEC_auspicious_calendar.md 섹션 6의 코드를 사용합니다.

3. `apps/mobile/src/services/nativeCalendarService.ts`
   SPEC_auspicious_calendar.md 섹션 9.3의 코드를 사용합니다.

4. 패키지를 설치합니다:
   pnpm --filter mobile add expo-calendar expo-notifications

5. 타입 체크:
   pnpm --filter mobile tsc --noEmit

오류가 있으면 수정해주세요.
```

---

### ✅ TASK 5 — 커스텀 훅 및 CalendarScreen

```
K-Saju Global 모바일 앱에서 다음 파일들을 생성해주세요.

1. `apps/mobile/src/hooks/useAuspiciousDays.ts`
   SPEC_auspicious_calendar.md 섹션 7의 코드를 사용합니다.

2. `apps/mobile/src/screens/CalendarScreen.tsx`
   SPEC_auspicious_calendar.md 섹션 8.1의 코드를 골격으로,
   SafeAreaView + EventTypePicker + MonthlyCalendarView + DayDetailModal 구조로 구현합니다.
   (하위 컴포넌트는 빈 컴포넌트로 먼저 stub 처리해도 됩니다)

3. 앱 탭 네비게이션에 Calendar 탭을 추가합니다:
   - 파일: `apps/mobile/src/app/(tabs)/_layout.tsx` (또는 프로젝트의 탭 라우터 파일)
   - 아이콘: calendar (ionicons)
   - i18n 키: calendar.title

4. 타입 체크:
   pnpm --filter mobile tsc --noEmit
```

---

### ✅ TASK 6 — 캘린더 UI 컴포넌트

```
K-Saju Global에서 캘린더 UI 컴포넌트들을 구현해주세요.
기존 오방색 디자인 시스템 토큰(OBANGSAEK)을 반드시 사용하세요.

1. `apps/mobile/src/components/calendar/DayCell.tsx`
   - DayStatus(lucky/neutral/unlucky)에 따라 오방색 배경 + 마커 표시
   - lucky: 연녹(#E8F5E9) + 🌟
   - unlucky: 연빨강(#FFEBEE) + ⚠️
   - 오늘: 파란 점 표시
   - Free 유저: lucky 상태인 날 중 점수 상위 3개만 lucky로 표시, 나머지는 neutral

2. `apps/mobile/src/components/calendar/EventTypePicker.tsx`
   - 결혼💍 / 이사🏠 / 계약📝 / 면접💼 탭
   - Free 유저: 결혼 탭만 활성화, 나머지 탭 클릭 시 Premium 업셀 바텀시트

3. `apps/mobile/src/components/calendar/MonthlyCalendarView.tsx`
   - 7열 × 6행 그리드 (요일 헤더 포함)
   - 월 이동 버튼 (<, >)
   - 음력 날짜 서브텍스트 (선택적)
   - 스켈레톤 로딩 (isLoading 상태)

4. `apps/mobile/src/components/calendar/DayDetailModal.tsx`
   - 바텀시트 모달
   - 천간/지지 배지, 점수 표시
   - AI 해석 섹션 (summary, reason, advice, luckyColor, luckyTime)
   - '캘린더에 추가' 버튼 → nativeCalendarService.addAuspiciousDay()
   - '알림 설정' 버튼 → D-7/3/1 선택 UI → nativeCalendarService.scheduleNotifications()
   - Free 유저: AI 해석 및 버튼 섹션에 BlurUpgradeOverlay 적용 (기존 컴포넌트 재사용)

5. 타입 체크:
   pnpm --filter mobile tsc --noEmit
```

---

### ✅ TASK 7 — i18n 키 추가

```
K-Saju Global의 15개 언어 번역 파일에 캘린더 i18n 키를 추가해주세요.

대상 파일: `apps/mobile/src/i18n/locales/` 내 모든 언어 파일
(ko, en, zh, ja, fr, de, th, id, ar, vi, es, pt, ru, hi, tl)

추가할 키 (SPEC_auspicious_calendar.md 섹션 10 참고):
- calendar.title
- calendar.lucky / unlucky / neutral
- calendar.eventTypes.wedding / moving / contract / interview
- calendar.addToCalendar
- calendar.setNotification
- calendar.notifyBefore
- calendar.heavenlyStem / earthlyBranch / luckyColor / luckyTime
- calendar.premiumRequired / upgradeNow

ko(한국어) 키를 먼저 완성하고, 나머지 언어는 번역하여 추가해주세요.
ar(아랍어)는 RTL 방향이므로 텍스트 방향에 주의하세요.
```

---

### ✅ TASK 8 — 최종 검증

```
K-Saju Global 길일/흉일 캘린더 기능 최종 검증을 수행해주세요.

[ ] 1. TypeScript 타입 오류 없음
    pnpm --filter mobile tsc --noEmit

[ ] 2. Edge Functions 3개 모두 배포 확인
    supabase functions list
    (calculate-auspicious-days, ai-calendar-interpretation, schedule-calendar-notifications)

[ ] 3. iOS 시뮬레이터에서 확인
    pnpm --filter mobile start
    - Calendar 탭 진입 → 캘린더 렌더링
    - 길일 셀 클릭 → DayDetailModal 오픈
    - AI 해석 로딩 → summary/reason/advice 표시
    - '캘린더에 추가' → 권한 요청 → 시뮬레이터 캘린더 앱에서 이벤트 확인

[ ] 4. Free/Premium 분기 확인
    - Free 계정: 길일 3개만 표시, AI 해석 블러, 이사/계약/면접 탭 잠금
    - Premium 계정: 전체 기능 활성화

[ ] 5. 다국어 확인
    - 설정에서 언어 변경 → AI 해석이 해당 언어로 출력되는지 확인
    - 캐시 키에 language 포함 → 언어 변경 시 새로운 AI 해석 생성

[ ] 6. 월 이동 확인
    - 이전/다음 달 이동 시 새 데이터 패치 및 캐시 동작

검증 중 발견된 버그는 즉시 수정해주세요.
```

---

## 13. 검증 체크리스트

모든 TASK 완료 후 아래 항목을 순서대로 확인합니다.

### 기능 검증

- [ ] `supabase functions list` — 3개 함수 정상 배포
- [ ] Calendar 탭 진입 → 월 캘린더 렌더링 (로딩 스켈레톤 → 데이터)
- [ ] 길일 셀 탭 → `DayDetailModal` 오픈 → AI 해석 표시
- [ ] '캘린더에 추가' → 권한 요청 → 네이티브 캘린더 앱에서 이벤트 확인 (iOS/Android)
- [ ] 알림 D-7/3/1 예약 → `Notifications.getAllScheduledNotificationsAsync()` 로 확인

### 프리미엄 검증

- [ ] Free 유저: 길일 3개만 표시 / 나머지 블러
- [ ] Free 유저: 이사/계약/면접 탭 → 업셀 바텀시트 표시
- [ ] Premium 유저: 전체 기능 활성화

### 다국어 검증

- [ ] 언어 변경 시 AI 해석 언어 변경 (캐시 키 language 포함 확인)
- [ ] 아랍어(ar) RTL 레이아웃 정상

### 성능

- [ ] 동일 month+eventType 재진입 시 캐시 응답 (`cached: true`)
- [ ] `pnpm --filter mobile tsc --noEmit` — 타입 오류 0

---

> **완료 후:** `feat/auspicious-calendar` → `main` PR 생성
> PR 제목: `feat: 길일/흉일 캘린더 (FEAT-CAL-001)`
