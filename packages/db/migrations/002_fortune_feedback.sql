-- K-Saju Global — Fortune Feedback
-- Issue #16: AI Feedback Loop
-- Run after: 001_rls_policies.sql
-- Note: FortuneFeedback table is created by Prisma (prisma db push).
--       This file adds RLS policies and extra indexes only.

-- ─────────────────────────────────────────────
-- FortuneFeedback table (Prisma-managed, camelCase columns)
-- Columns: id, userId, fortuneId, rating, feedbackType, createdAt
-- ─────────────────────────────────────────────

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
-- Indexes (supplement Prisma-generated ones)
-- ─────────────────────────────────────────────

-- Fetch recent feedback per user for Claude prompt injection
-- "createdAt" = Prisma camelCase convention
CREATE INDEX IF NOT EXISTS idx_fortune_feedback_user_date
  ON public."FortuneFeedback" ("userId", "createdAt" DESC);

-- Look up feedback by reading
CREATE INDEX IF NOT EXISTS idx_fortune_feedback_fortune
  ON public."FortuneFeedback" ("fortuneId");
