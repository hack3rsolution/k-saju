-- K-Saju Global — Fortune Feedback
-- Issue #16: AI Feedback Loop
-- Run after: 001_rls_policies.sql

-- ─────────────────────────────────────────────
-- FortuneFeedback table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."FortuneFeedback" (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        TEXT        NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "fortuneId"     UUID        REFERENCES public."Reading"(id) ON DELETE SET NULL,
  rating          SMALLINT    NOT NULL CHECK (rating IN (1, -1)),
  feedback_type   TEXT        CHECK (feedback_type IN ('accurate', 'too_vague', 'not_me')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public."FortuneFeedback" ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
CREATE POLICY "feedback_select_own"
  ON public."FortuneFeedback" FOR SELECT
  USING (auth.uid()::text = "userId");

-- Users can insert their own feedback
CREATE POLICY "feedback_insert_own"
  ON public."FortuneFeedback" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

-- Fetch recent feedback per user (for Claude prompt injection)
CREATE INDEX IF NOT EXISTS idx_fortune_feedback_user_date
  ON public."FortuneFeedback" ("userId", created_at DESC);

-- Look up feedback by reading
CREATE INDEX IF NOT EXISTS idx_fortune_feedback_fortune
  ON public."FortuneFeedback" ("fortuneId");
