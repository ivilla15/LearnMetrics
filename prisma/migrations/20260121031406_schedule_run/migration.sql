-- AlterTable
ALTER TABLE "AssignmentScheduleRun" ADD COLUMN     "isSkipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skippedAt" TIMESTAMP(3);
