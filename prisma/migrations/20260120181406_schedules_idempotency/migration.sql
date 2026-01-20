-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "scheduleId" INTEGER;

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'America/Los_Angeles';

-- CreateTable
CREATE TABLE "AssignmentScheduleRun" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL,
    "assignmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentScheduleRun_scheduleId_idx" ON "AssignmentScheduleRun"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentScheduleRun_scheduleId_runDate_key" ON "AssignmentScheduleRun"("scheduleId", "runDate");

-- CreateIndex
CREATE INDEX "Assignment_scheduleId_idx" ON "Assignment"("scheduleId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AssignmentSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentScheduleRun" ADD CONSTRAINT "AssignmentScheduleRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AssignmentSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentScheduleRun" ADD CONSTRAINT "AssignmentScheduleRun_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
