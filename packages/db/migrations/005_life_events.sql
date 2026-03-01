-- Migration 005: life_events table (v2.0.0 — Issue #21)
-- Life Journal: track major life events and correlate with saju flows.

CREATE TABLE IF NOT EXISTS public.life_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('career','love','health','family','travel','finance','education','other')),
  event_date  DATE        NOT NULL,
  note        TEXT,
  sentiment   TEXT        NOT NULL CHECK (sentiment IN ('positive','neutral','negative')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user queries (ordered by date descending)
CREATE INDEX IF NOT EXISTS life_events_user_date_idx
  ON public.life_events(user_id, event_date DESC);

-- RLS
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own life events"
  ON public.life_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life events"
  ON public.life_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own life events"
  ON public.life_events FOR DELETE
  USING (auth.uid() = user_id);

-- journal_analysis_cache: 7-day cache keyed by user_id
CREATE TABLE IF NOT EXISTS public.journal_analysis_cache (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis    JSONB       NOT NULL,
  event_count INT         NOT NULL DEFAULT 0,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis cache"
  ON public.journal_analysis_cache FOR SELECT
  USING (auth.uid() = user_id);
