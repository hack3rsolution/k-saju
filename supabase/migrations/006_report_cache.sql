-- Migration 006: Persistent AI report cache
-- Prevents redundant Claude API calls by storing generated reports in DB.
-- Cache is keyed by (user_id, report_type, period_key) with expiry.

CREATE TABLE IF NOT EXISTS public.report_cache (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text        NOT NULL,
  period_key  text        NOT NULL,
  report_data jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_type, period_key)
);

ALTER TABLE public.report_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own cached reports
CREATE POLICY "report_cache_select"
  ON public.report_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS report_cache_lookup
  ON public.report_cache(user_id, report_type, period_key);
