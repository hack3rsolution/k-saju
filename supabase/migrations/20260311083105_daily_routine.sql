-- ============================================================
-- Migration: daily_routine_cache + notification_preferences
-- K-Saju Global v2.4.0 — feat/five-elements-daily-routine
-- ============================================================

-- ── 데일리 루틴 캐시 테이블 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_routine_cache (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE        NOT NULL,
  dominant_element TEXT        NOT NULL
                               CHECK (dominant_element IN ('Wood','Fire','Earth','Metal','Water')),
  element_score    JSONB       NOT NULL DEFAULT '{}',   -- { Wood:1.5, Fire:4.5, ... }
  foods            JSONB       NOT NULL DEFAULT '[]',   -- [{name, emoji, reason, color_match}]
  colors           JSONB       NOT NULL DEFAULT '[]',   -- [{hex, name, reason}]
  activities       JSONB       NOT NULL DEFAULT '[]',   -- [{title, duration, icon, timing, reason}]
  meditation_text  TEXT        NOT NULL,
  language         TEXT        NOT NULL DEFAULT 'en',
  cultural_frame   TEXT        NOT NULL DEFAULT 'north_america',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date, language)
);

-- RLS
ALTER TABLE daily_routine_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_routine"
  ON daily_routine_cache
  FOR ALL
  USING (auth.uid() = user_id);

-- 인덱스 (날짜별 조회 성능)
CREATE INDEX IF NOT EXISTS idx_daily_routine_user_date_lang
  ON daily_routine_cache (user_id, date, language);

-- ── 알림 설정 테이블 ──────────────────────────────────────────────────────────
-- notification_preferences가 없는 경우 먼저 생성
CREATE TABLE IF NOT EXISTS notification_preferences (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notification_prefs"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- 데일리 루틴 알림 컬럼 추가
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS daily_routine_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS daily_routine_time    TIME    DEFAULT '07:30:00';
