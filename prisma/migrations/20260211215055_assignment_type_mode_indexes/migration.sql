/*
  Warnings:

  - You are about to drop the column `assignmentMode` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Teacher` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('SCHEDULED', 'MAKEUP', 'MANUAL');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('TEST', 'PRACTICE', 'REMEDIATION', 'PLACEMENT');

-- DropIndex (old index referencing the soon-to-be-removed columns)
DROP INDEX IF EXISTS "Assignment_classroomId_kind_opensAt_key";

-- AlterTable: change Assignment structure
ALTER TABLE "Assignment"
  DROP COLUMN IF EXISTS "assignmentMode",
  DROP COLUMN IF EXISTS "date",
  DROP COLUMN IF EXISTS "kind",
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "mode" "Mode" NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN "parentAssignmentId" INTEGER,
  ADD COLUMN "type" "Type" NOT NULL DEFAULT 'TEST',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "closesAt" DROP NOT NULL;

-- AlterTable: change Attempt columns
ALTER TABLE "Attempt"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "completedAt" DROP NOT NULL,
  ALTER COLUMN "completedAt" DROP DEFAULT;

-- AlterTable: rename password -> passwordHash for Student and Teacher (no drop)
ALTER TABLE "Student" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "Teacher" RENAME COLUMN "password" TO "passwordHash";

-- Now drop the old enums (safe now that referencing columns are gone)
DROP TYPE IF EXISTS "AssignmentKind";
DROP TYPE IF EXISTS "AssignmentMode";

-- Indexes
CREATE INDEX IF NOT EXISTS "Assignment_closesAt_idx" ON "Assignment"("closesAt");
CREATE INDEX IF NOT EXISTS "Assignment_classroomId_runDate_idx" ON "Assignment"("classroomId", "runDate");
CREATE INDEX IF NOT EXISTS "Assignment_classroomId_type_idx" ON "Assignment"("classroomId", "type");
CREATE INDEX IF NOT EXISTS "Assignment_classroomId_opensAt_idx" ON "Assignment"("classroomId", "opensAt");
CREATE INDEX IF NOT EXISTS "Assignment_scheduleId_runDate_idx" ON "Assignment"("scheduleId", "runDate");

CREATE INDEX IF NOT EXISTS "AssignmentRecipient_assignmentId_idx" ON "AssignmentRecipient"("assignmentId");
CREATE INDEX IF NOT EXISTS "AssignmentScheduleRun_runDate_idx" ON "AssignmentScheduleRun"("runDate");

CREATE INDEX IF NOT EXISTS "Attempt_studentId_idx" ON "Attempt"("studentId");
CREATE INDEX IF NOT EXISTS "Attempt_studentId_completedAt_idx" ON "Attempt"("studentId", "completedAt");
CREATE INDEX IF NOT EXISTS "Attempt_assignmentId_completedAt_idx" ON "Attempt"("assignmentId", "completedAt");

CREATE INDEX IF NOT EXISTS "AttemptItem_attemptId_idx" ON "AttemptItem"("attemptId");

CREATE INDEX IF NOT EXISTS "StudentSession_expiresAt_idx" ON "StudentSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "TeacherSession_expiresAt_idx" ON "TeacherSession"("expiresAt");

-- AddForeignKey (NO IF NOT EXISTS here; Postgres doesn't support it)
ALTER TABLE "Assignment"
  ADD CONSTRAINT "Assignment_parentAssignmentId_fkey"
  FOREIGN KEY ("parentAssignmentId") REFERENCES "Assignment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;