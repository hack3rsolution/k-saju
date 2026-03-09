-- Migration 005: Add language column to Reading table
-- Fixes: cached readings returned regardless of user language setting

-- 1. Add language column (default 'ko' for existing rows)
ALTER TABLE "public"."Reading"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'ko';

-- 2. Drop old unique constraint (userId, type, refDate, culturalFrame)
ALTER TABLE "public"."Reading"
  DROP CONSTRAINT IF EXISTS "Reading_userId_type_refDate_culturalFrame_key";

-- 3. Add new unique constraint that includes language
CREATE UNIQUE INDEX IF NOT EXISTS "Reading_userId_type_refDate_culturalFrame_language_key"
  ON "public"."Reading"("userId", "type", "refDate", "culturalFrame", "language");
