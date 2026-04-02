BEGIN;

-- -------------------------------------------------------------------
-- Assignment: add practice-set fields
-- -------------------------------------------------------------------
ALTER TABLE "learnmetrics"."Assignment"
  ADD COLUMN IF NOT EXISTS "requiredSets"        INTEGER,
  ADD COLUMN IF NOT EXISTS "minimumScorePercent" INTEGER;

-- -------------------------------------------------------------------
-- PracticeSession: add new columns
-- -------------------------------------------------------------------
ALTER TABLE "learnmetrics"."PracticeSession"
  ADD COLUMN IF NOT EXISTS "assignmentId" INTEGER,
  ADD COLUMN IF NOT EXISTS "score"        INTEGER,
  ADD COLUMN IF NOT EXISTS "total"        INTEGER,
  ADD COLUMN IF NOT EXISTS "qualified"    BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------------------
-- Add FK constraint safely (only if not already present)
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'PracticeSession_assignmentId_fkey'
  ) THEN
    ALTER TABLE "learnmetrics"."PracticeSession"
      ADD CONSTRAINT "PracticeSession_assignmentId_fkey"
      FOREIGN KEY ("assignmentId")
      REFERENCES "learnmetrics"."Assignment"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "PracticeSession_assignmentId_idx"
  ON "learnmetrics"."PracticeSession"("assignmentId");

CREATE INDEX IF NOT EXISTS "PracticeSession_assignmentId_studentId_idx"
  ON "learnmetrics"."PracticeSession"("assignmentId", "studentId");

COMMIT;

-- -------------------------------------------------------------------
-- Verification (run after commit)
-- -------------------------------------------------------------------
SELECT
  COUNT(*) FILTER (WHERE "assignmentId" IS NOT NULL) AS sessions_with_assignment,
  COUNT(*) FILTER (WHERE "qualified" = true)         AS qualified_sessions
FROM "learnmetrics"."PracticeSession";