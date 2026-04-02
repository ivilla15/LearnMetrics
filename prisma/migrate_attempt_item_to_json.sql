-- =============================================================================
-- Phase 1 of 2: Add JSON columns and backfill from integer columns
-- =============================================================================
--
-- What this does:
--   1. Adds operandAValue, operandBValue, correctAnswerValue, givenAnswerValue
--      as nullable jsonb columns (safe — existing rows keep their old values)
--   2. Backfills the new columns from the existing integer columns
--   3. Does NOT touch old columns (operandA, operandB, correctAnswer, givenAnswer)
--   4. Does NOT add NOT NULL constraints
--   5. Does NOT drop anything
--
-- Phase 2 (separate file, run after verification):
--   - Add NOT NULL on operandAValue / operandBValue / correctAnswerValue
--   - Apply any sentinel → NULL mapping on givenAnswerValue (after you confirm
--     what sentinel value the app actually wrote — run the verification queries
--     in the section below first)
--   - Drop the old integer columns
--
-- How to run:
--   npx prisma db execute --file prisma/migrate_attempt_item_to_json.sql --schema prisma/schema.prisma
--   (Use your DIRECT_URL, not the pooler URL, for DDL statements on Supabase.)
--
-- Conversion rules applied here:
--   operandA     Int  →  {"kind":"integer","value": N}   (OperandValue — integers are operands)
--   operandB     Int  →  {"kind":"integer","value": N}   (OperandValue)
--   correctAnswer Int →  {"kind":"decimal","value": N}   (AnswerValue — no IntegerAnswer variant)
--   givenAnswer   Int →  {"kind":"decimal","value": N}   (all values preserved as-is in Phase 1;
--                                                          sentinel → NULL mapping deferred to Phase 2
--                                                          once you verify what sentinel was used)
-- =============================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- Step 1: Add new jsonb columns (all nullable — safe, no table rewrite)
-- -------------------------------------------------------------------------
ALTER TABLE "learnmetrics"."AttemptItem"
  ADD COLUMN IF NOT EXISTS "operandAValue"      jsonb,
  ADD COLUMN IF NOT EXISTS "operandBValue"      jsonb,
  ADD COLUMN IF NOT EXISTS "correctAnswerValue" jsonb,
  ADD COLUMN IF NOT EXISTS "givenAnswerValue"   jsonb;

-- -------------------------------------------------------------------------
-- Step 2: Backfill new columns from existing integer columns
--
-- The WHERE clause makes this idempotent:
--   - Safe to re-run if interrupted
--   - Will not overwrite rows already migrated (e.g. if re-run after partial success)
-- -------------------------------------------------------------------------
UPDATE "learnmetrics"."AttemptItem"
SET
  "operandAValue"      = jsonb_build_object('kind', 'integer', 'value', "operandA"),
  "operandBValue"      = jsonb_build_object('kind', 'integer', 'value', "operandB"),
  "correctAnswerValue" = jsonb_build_object('kind', 'decimal',  'value', ("correctAnswer")::float8),
  -- givenAnswer: all values preserved as JSON in Phase 1.
  -- No sentinel mapping yet — inspect the verification queries below first.
  "givenAnswerValue"   = jsonb_build_object('kind', 'decimal', 'value', ("givenAnswer")::float8)
WHERE
  "operandAValue" IS NULL;  -- skip rows already backfilled

COMMIT;


-- =============================================================================
-- Verification queries
-- Run these AFTER Phase 1 completes. They read only — safe to run any time.
-- =============================================================================

-- -------------------------------------------------------------------------
-- V1. Counts: how many rows exist, how many were backfilled
-- -------------------------------------------------------------------------
SELECT
  COUNT(*)                                             AS total_rows,
  COUNT("operandAValue")                               AS backfilled_rows,
  COUNT(*) - COUNT("operandAValue")                    AS not_yet_backfilled
FROM "learnmetrics"."AttemptItem";

-- -------------------------------------------------------------------------
-- V2. Distribution of givenAnswer values
-- Use this to determine whether a sentinel was written for "no answer"
-- (e.g. -1, 0, or something else), and how common it is.
-- -------------------------------------------------------------------------
SELECT
  "givenAnswer"                   AS given_answer_int,
  COUNT(*)                        AS row_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
FROM "learnmetrics"."AttemptItem"
GROUP BY "givenAnswer"
ORDER BY row_count DESC
LIMIT 30;

-- -------------------------------------------------------------------------
-- V3. Side-by-side comparison of old and new values (sample 20 rows)
-- Visually confirm the JSON shapes look correct before Phase 2.
-- -------------------------------------------------------------------------
SELECT
  id,
  "operandA",        "operandAValue",
  "operandB",        "operandBValue",
  "correctAnswer",   "correctAnswerValue",
  "givenAnswer",     "givenAnswerValue",
  "isCorrect"
FROM "learnmetrics"."AttemptItem"
ORDER BY id DESC
LIMIT 20;

-- -------------------------------------------------------------------------
-- V4. Spot-check: any row where the numeric value in JSON differs from the
-- original integer (should return zero rows if backfill is correct)
-- -------------------------------------------------------------------------
SELECT id, "operandA", "operandAValue"
FROM "learnmetrics"."AttemptItem"
WHERE
  "operandAValue" IS NOT NULL
  AND ("operandAValue"->>'value')::float8 <> "operandA"::float8;

SELECT id, "correctAnswer", "correctAnswerValue"
FROM "learnmetrics"."AttemptItem"
WHERE
  "correctAnswerValue" IS NOT NULL
  AND ("correctAnswerValue"->>'value')::float8 <> "correctAnswer"::float8;

-- -------------------------------------------------------------------------
-- V5. Any rows where givenAnswerValue came out NULL (should be zero in
-- Phase 1 since we wrote JSON for every row — NULL here would indicate
-- a column that was somehow already NULL before Phase 1 ran)
-- -------------------------------------------------------------------------
SELECT COUNT(*) AS rows_with_null_givenAnswerValue
FROM "learnmetrics"."AttemptItem"
WHERE "givenAnswerValue" IS NULL
  AND "operandAValue" IS NOT NULL;  -- only among migrated rows
