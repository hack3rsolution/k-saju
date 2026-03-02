-- K-Saju Global — Row Level Security Policies
-- Run after: prisma migrate deploy
-- Supabase: auth.uid() returns the logged-in user's UUID

-- ─────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────

ALTER TABLE public."User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SajuChart"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Reading"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AddonPurchase"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CompatibilityReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PushToken"          ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────

CREATE POLICY "users_select_own"
  ON public."User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "users_update_own"
  ON public."User" FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "users_insert_own"
  ON public."User" FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- ─────────────────────────────────────────────
-- SajuChart
-- ─────────────────────────────────────────────

CREATE POLICY "charts_select_own"
  ON public."SajuChart" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "charts_upsert_own"
  ON public."SajuChart" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "charts_update_own"
  ON public."SajuChart" FOR UPDATE
  USING (auth.uid()::text = "userId");

-- ─────────────────────────────────────────────
-- Readings
-- ─────────────────────────────────────────────

CREATE POLICY "readings_select_own"
  ON public."Reading" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "readings_insert_service"
  ON public."Reading" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- ─────────────────────────────────────────────
-- Subscriptions
-- ─────────────────────────────────────────────

CREATE POLICY "subscriptions_select_own"
  ON public."Subscription" FOR SELECT
  USING (auth.uid()::text = "userId");

-- Subscriptions are written by service role (RevenueCat webhook)
-- so no user INSERT/UPDATE policy needed

-- ─────────────────────────────────────────────
-- AddonPurchases
-- ─────────────────────────────────────────────

CREATE POLICY "addons_select_own"
  ON public."AddonPurchase" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "addons_insert_own"
  ON public."AddonPurchase" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- ─────────────────────────────────────────────
-- CompatibilityReports
-- ─────────────────────────────────────────────

CREATE POLICY "compat_select_own"
  ON public."CompatibilityReport" FOR SELECT
  USING (auth.uid()::text = "requesterId");

CREATE POLICY "compat_insert_own"
  ON public."CompatibilityReport" FOR INSERT
  WITH CHECK (auth.uid()::text = "requesterId");

-- ─────────────────────────────────────────────
-- PushTokens
-- ─────────────────────────────────────────────

CREATE POLICY "push_select_own"
  ON public."PushToken" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "push_upsert_own"
  ON public."PushToken" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "push_update_own"
  ON public."PushToken" FOR UPDATE
  USING (auth.uid()::text = "userId");

-- ─────────────────────────────────────────────
-- Indexes (supplement Prisma-generated ones)
-- ─────────────────────────────────────────────

-- Readings: frequent query pattern — user + type + date range
CREATE INDEX IF NOT EXISTS idx_readings_user_type_date
  ON public."Reading" ("userId", type, "refDate" DESC);

-- Subscriptions: lookup by expiry for cron cleanup
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
  ON public."Subscription" ("expiresAt")
  WHERE "expiresAt" IS NOT NULL;

-- PushTokens: active tokens for batch notification sends
CREATE INDEX IF NOT EXISTS idx_push_tokens_active
  ON public."PushToken" (token)
  WHERE active = true;
