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
