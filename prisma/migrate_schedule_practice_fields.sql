BEGIN;

ALTER TABLE "learnmetrics"."AssignmentSchedule"
  ADD COLUMN IF NOT EXISTS "requiredSets" INTEGER,
  ADD COLUMN IF NOT EXISTS "minimumScorePercent" INTEGER;

COMMIT;
