-- =============================================================================
-- Phase 2 of 2: Enforce NOT NULL on JSON columns, drop old integer columns
-- =============================================================================
-- Prerequisites:
--   - Phase 1 has run successfully
--   - Verification queries V1–V5 passed (zero mismatches, full backfill)
-- =============================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- Step 1: Enforce NOT NULL on the three required JSON columns
-- (givenAnswerValue stays nullable — maps to Json? in schema.prisma)
-- -------------------------------------------------------------------------
ALTER TABLE "learnmetrics"."AttemptItem"
  ALTER COLUMN "operandAValue"      SET NOT NULL,
  ALTER COLUMN "operandBValue"      SET NOT NULL,
  ALTER COLUMN "correctAnswerValue" SET NOT NULL;

-- -------------------------------------------------------------------------
-- Step 2: Drop old integer columns
-- -------------------------------------------------------------------------
ALTER TABLE "learnmetrics"."AttemptItem"
  DROP COLUMN "operandA",
  DROP COLUMN "operandB",
  DROP COLUMN "correctAnswer",
  DROP COLUMN "givenAnswer";

COMMIT;


-- =============================================================================
-- Verification queries (read-only, run after COMMIT)
-- =============================================================================

-- V1. Confirm old columns are gone (should return 0 rows each)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'learnmetrics'
  AND table_name   = 'AttemptItem'
  AND column_name IN ('operandA', 'operandB', 'correctAnswer', 'givenAnswer');

-- V2. Confirm new columns exist with correct nullability
--   is_nullable should be: NO / NO / NO / YES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'learnmetrics'
  AND table_name   = 'AttemptItem'
  AND column_name IN ('operandAValue', 'operandBValue', 'correctAnswerValue', 'givenAnswerValue')
ORDER BY column_name;

-- V3. Confirm no NULLs slipped into required columns (should return 0)
SELECT COUNT(*) AS null_violations
FROM "learnmetrics"."AttemptItem"
WHERE "operandAValue" IS NULL
   OR "operandBValue" IS NULL
   OR "correctAnswerValue" IS NULL;

-- V4. Spot-check final shape of a few rows
SELECT id, operation, "operandAValue", "operandBValue", "correctAnswerValue", "givenAnswerValue", "isCorrect"
FROM "learnmetrics"."AttemptItem"
ORDER BY id DESC
LIMIT 10;
