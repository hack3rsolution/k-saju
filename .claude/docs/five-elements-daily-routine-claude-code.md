# 오행 에너지 기반 데일리 루틴 카드 — Claude Code 명령어 세트

> K-Saju Global v2.4.0 | feat/five-elements-daily-routine

---

## 기능 개요

| 항목 | 내용 |
|------|------|
| 오늘의 지배 오행 | 日支(일지) + 月支(월지) 기준 계산 |
| 추천 콘텐츠 | 음식 / 색상 / 활동 3종 |
| 명상 텍스트 | CHANI 스타일 1–2문장 (감성적, 직접적) |
| 갱신 주기 | 자정 기준 일별 갱신 |
| 푸시 알림 | 매일 아침 (기본 07:30, 사용자 설정 가능) |
| 접근 권한 | Free: 오행 + 색상 공개 / Premium: 전체 |

---

## Phase 1 — DB 마이그레이션 & Edge Function

### 명령어 1: Supabase 마이그레이션

```
다음 Supabase 마이그레이션을 생성하고 적용해줘.

파일: supabase/migrations/YYYYMMDDHHMMSS_daily_routine.sql

-- 데일리 루틴 캐시 테이블
CREATE TABLE daily_routine_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  dominant_element TEXT NOT NULL CHECK (dominant_element IN ('Wood','Fire','Earth','Metal','Water')),
  element_score JSONB NOT NULL DEFAULT '{}',  -- 오행별 점수
  foods JSONB NOT NULL DEFAULT '[]',          -- [{name, emoji, reason}]
  colors JSONB NOT NULL DEFAULT '[]',         -- [{hex, name, reason}]
  activities JSONB NOT NULL DEFAULT '[]',     -- [{title, duration, icon}]
  meditation_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  cultural_frame TEXT NOT NULL DEFAULT 'north_america',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, language)
);

-- RLS
ALTER TABLE daily_routine_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_routine" ON daily_routine_cache
  FOR ALL USING (auth.uid() = user_id);

-- 알림 설정 테이블 (notification_preferences에 컬럼 추가)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS daily_routine_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS daily_routine_time TIME DEFAULT '07:30:00';

마이그레이션 적용:
npx supabase db push

완료 후 테이블 존재 확인:
npx supabase db diff
```

---

### 명령어 2: Edge Function — daily-routine

```
Supabase Edge Function을 생성해줘.
파일: supabase/functions/daily-routine/index.ts

## 핵심 로직

### 1. 오행 지배력 계산
입력받은 사주 데이터에서 오늘 날짜 기준:
- 일간(Day Stem) 오행 × 2.0 가중치
- 일지(Day Branch) 오행 × 1.5 가중치
- 월지(Month Branch) 오행 × 1.0 가중치
- 현재 세운(Year Pillar) 오행 × 0.8 가중치

가중합 기준으로 dominant_element 결정.

### 2. Claude API 프롬프트 구조
system: |
  You are a Korean 사주 master creating daily wellness routines.
  Output ONLY valid JSON, no markdown, no explanation.
  
  오행별 기본 특성:
  木(Wood): growth, flexibility, creativity, liver/eyes
  火(Fire): passion, expression, connection, heart/small intestine  
  土(Earth): stability, nourishment, centering, stomach/spleen
  金(Metal): precision, release, refinement, lung/large intestine
  水(Water): depth, wisdom, flow, kidney/bladder

user: |
  오늘의 지배 오행: {{dominant_element}} (점수: {{scores}})
  사용자 사주: {{saju_summary}}
  언어: {{language}}
  문화권: {{cultural_frame}}
  오늘 날짜: {{date_korea}}

  다음 JSON을 반환해:
  {
    "meditation_text": "CHANI 스타일 1-2문장. 오행의 에너지를 직접적이고 시적으로 표현. 2인칭(You/당신) 사용.",
    "foods": [
      {"name": "식품명", "emoji": "🍅", "reason": "오행 연결 이유 1문장", "color_match": true}
    ],
    "colors": [
      {"hex": "#E63946", "name": "색상명", "reason": "착용/인테리어 활용 제안"}
    ],
    "activities": [
      {"title": "활동명", "duration": "10분", "icon": "🏃", "timing": "아침/낮/저녁", "reason": "오행 연결 이유"}
    ]
  }

  foods 3개, colors 2개, activities 3개 반환.
  {{cultural_frame}}에 맞는 문화적 레퍼런스 사용.

### 3. Fallback 데이터 (API 실패 시)
오행별 정적 데이터를 함수 내에 하드코딩:

Wood: foods=[🥦브로콜리, 🥑아보카도, 🫛완두콩], colors=[#228B22, #90EE90], activities=[스트레칭, 독서, 창작활동]
Fire: foods=[🍅토마토, 🫑빨간파프리카, 🍓딸기], colors=[#E63946, #FF6B6B], activities=[심장 유산소, 대화, 발표]
Earth: foods=[🍠고구마, 🌽옥수수, 🍯꿀], colors=[#D4A017, #8B6914], activities=[명상, 요가, 요리]
Metal: foods=[🧅양파, 🫚참기름, 🍚흰쌀], colors=[#C0C0C0, #F5F5F5], activities=[정리정돈, 호흡법, 글쓰기]
Water: foods=[🫐블루베리, 🥒오이, 🐟생선], colors=[#1A1A2E, #4A90D9], activities=[수영, 일기쓰기, 명상]

### 4. 캐시 로직
- user_id + date + language 조합 확인
- 있으면 캐시 반환
- 없으면 Claude API 호출 후 저장
- Service Role Key 사용 (JWT 없이)

### 5. 응답 형식
{
  "dominant_element": "Fire",
  "element_score": {"Wood": 1.5, "Fire": 4.5, "Earth": 1.0, "Metal": 0.8, "Water": 0.5},
  "meditation_text": "...",
  "foods": [...],
  "colors": [...],
  "activities": [...],
  "cached": true,
  "date": "2025-03-11"
}

배포:
npx supabase functions deploy daily-routine --no-verify-jwt
```

---

## Phase 2 — React Native 컴포넌트

### 명령어 3: 오행 루틴 카드 컴포넌트

```
다음 컴포넌트를 생성해줘.

## 파일 1: apps/mobile/components/daily-routine/ElementRoutineCard.tsx

오늘의 오행 루틴 메인 카드 컴포넌트.

### UI 구조
┌─────────────────────────────────┐
│  🔥 Today's Energy  · Fire      │  ← 오행 이모지 + 이름
│  ─────────────────────────────  │
│  "Your energy burns bright..."  │  ← 명상 텍스트 (이탤릭)
│                                 │
│  🍽️ Nourish    🎨 Wear   🏃 Do  │  ← 3개 섹션 탭
│  ─────────────────────────────  │
│  🍅 Tomatoes                    │  ← 각 섹션 내용
│  🫑 Red Peppers                 │
│  🍓 Strawberries                │
│                                 │
│  [Share Today's Energy] 🌟      │  ← 공유 버튼
└─────────────────────────────────┘

### 오행별 테마 색상 (오방색 기반)
Wood:  background="#F0FDF4" accent="#16A34A" emoji="🌱"
Fire:  background="#FFF1F2" accent="#E11D48" emoji="🔥"
Earth: background="#FFFBEB" accent="#D97706" emoji="🌾"
Metal: background="#F8FAFC" accent="#64748B" emoji="⚡"
Water: background="#EFF6FF" accent="#2563EB" emoji="💧"

### Props
interface ElementRoutineCardProps {
  data: DailyRoutineData | null;
  isLoading: boolean;
  isPremium: boolean;
  onShare: () => void;
}

### Free vs Premium
- Free: meditation_text + colors 표시, foods/activities는 블러 + "Unlock Full Routine" CTA
- Premium: 전체 표시

### 로딩 상태
Skeleton 컴포넌트 사용 (기존 패턴 따름)

---

## 파일 2: apps/mobile/components/daily-routine/RoutineShareCard.tsx

SNS 공유용 카드 (react-native-view-shot 사용).

### 공유 카드 레이아웃 (1080×1080px 기준)
┌─────────────────────────────────┐
│     🔥 FIRE DAY                 │
│     March 11, 2025              │
│                                 │
│  "Your energy burns bright..."  │
│                                 │
│  ●●●●●●●●●●●●●●●●●●●●●●●●●●  │  ← 오행 색상 구분선
│                                 │
│  Eat Red  ·  Wear Crimson       │
│  Move with Heart Energy         │
│                                 │
│         K-Saju Global           │
│         #FiveElements #KSaju    │
└─────────────────────────────────┘

---

## 파일 3: apps/mobile/hooks/useDailyRoutine.ts

```typescript
// React Query + Supabase Edge Function 연동
// - 오늘 날짜 기준 자동 fetch
// - 15분 stale time
// - 자정에 자동 invalidate
// - 에러 시 fallback 로컬 데이터 사용
```

TypeScript 에러 0개, 기존 코드 스타일 일치.
```

---

### 명령어 4: 홈 화면 통합

```
홈 화면(app/(tabs)/index.tsx)에 데일리 루틴 카드를 통합해줘.

## 위치
Today's Fortune 카드 바로 아래, Weekly Fortune 위.

## 섹션 헤더
"오늘의 에너지 루틴" (영문: "Today's Energy Routine")
작은 정보 버튼(ℹ️) → 오행 설명 모달

## 조건부 렌더링
- 사주 데이터 있을 때만 표시
- 로딩 중: Skeleton
- 에러: "Unable to load routine. Try again." + retry 버튼

## 스크롤 순서 (위→아래)
1. 사주 날짜 헤더
2. Today's Fortune 카드
3. Today's Energy Routine ← 추가
4. Weekly Fortune (프리미엄 게이트)
5. Quick Actions (Compatibility, Report, Chat)
```

---

## Phase 3 — 푸시 알림

### 명령어 5: 데일리 루틴 알림

```
데일리 루틴 푸시 알림을 구현해줘.

## 파일: apps/mobile/lib/notifications/dailyRoutineNotification.ts

### 알림 내용 생성 로직
오행에 따라 다른 알림 텍스트:

Wood: "🌱 Wood energy grows today. Stretch before noon."
Fire: "🔥 Fire energy rises. Speak up and connect."
Earth: "🌾 Earth grounds you today. Slow down and nourish."
Metal: "⚡ Metal sharpens focus. Clear space, clear mind."
Water: "💧 Water flows deeply. Journal your thoughts."

### 알림 스케줄링
- Expo Notifications + scheduleNotificationAsync
- 사용자 설정 시간 (기본 07:30 KST → UTC 변환)
- 매일 반복 (DailyTriggerInput)
- 알림 탭 시 → 앱 홈 탭 이동 + 루틴 카드 하이라이트

### 설정 화면 통합 (app/(tabs)/settings.tsx에 추가)
"Daily Routine Reminder" 섹션:
- 토글 (on/off)
- 시간 선택 (TimePicker, 기존 컴포넌트 재사용)
- 설정 변경 → Supabase notification_preferences 업데이트

### 알림 권한 요청
온보딩 완료 직후 (기존 알림 권한 요청 플로우에 통합)

TypeScript 에러 0개.
```

---

## Phase 4 — 검증 및 완료

### 명령어 6: QA 검증

```
오행 데일리 루틴 기능 전체 검증을 진행해줘.

## 검증 항목

### Edge Function 테스트
curl -X POST "$(npx supabase functions list | grep daily-routine | awk '{print $2}')" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-uuid",
    "saju_data": {
      "day_stem": "丙", "day_branch": "午",
      "month_branch": "巳", "year_stem": "甲"
    },
    "language": "en",
    "cultural_frame": "north_america"
  }'

기대 응답: dominant_element = "Fire"

### UI 체크리스트
- [ ] 홈 화면에 루틴 카드 렌더링
- [ ] 5개 오행 × 탭 전환 (음식/색상/활동) 동작
- [ ] 명상 텍스트 렌더링
- [ ] Free: 음식/활동 블러 + CTA 표시
- [ ] Premium: 전체 콘텐츠 표시
- [ ] 공유 버튼 → 카드 이미지 생성 → 공유 시트
- [ ] 알림 토글 → 스케줄 등록 확인

### TypeScript 검증
npx tsc --noEmit

### 버전 관리
- 브랜치: feat/five-elements-daily-routine
- 버전 bump: 2.4.0 (apps/mobile/app.json)
- git commit: "feat: five elements daily routine card with push notifications"
- PR 생성 → main 머지

완료 알림:
osascript << 'APPLESCRIPT'
display notification "오행 루틴 카드 완성! v2.4.0 ready" with title "K-Saju"
APPLESCRIPT
```

---

## 파일 생성 체크리스트

```
새로 생성:
□ supabase/migrations/YYYYMMDD_daily_routine.sql
□ supabase/functions/daily-routine/index.ts
□ apps/mobile/components/daily-routine/ElementRoutineCard.tsx
□ apps/mobile/components/daily-routine/RoutineShareCard.tsx
□ apps/mobile/hooks/useDailyRoutine.ts
□ apps/mobile/lib/notifications/dailyRoutineNotification.ts

수정:
□ apps/mobile/app/(tabs)/index.tsx          ← 루틴 카드 통합
□ apps/mobile/app/(tabs)/settings.tsx       ← 알림 설정 추가
□ apps/mobile/app.json                      ← 버전 2.4.0
```

---

## 예상 작업 시간

| Phase | 내용 | 예상 시간 |
|-------|------|-----------|
| 1 | DB + Edge Function | 30–40분 |
| 2 | 컴포넌트 3개 | 40–60분 |
| 3 | 푸시 알림 | 20–30분 |
| 4 | QA + PR | 20–30분 |
| **합계** | | **~2.5시간** |
