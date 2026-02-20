-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('SCHEDULED', 'MAKEUP', 'MANUAL');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('TEST', 'PRACTICE', 'REMEDIATION', 'PLACEMENT');

-- CreateEnum
CREATE TYPE "AssignmentTargetKind" AS ENUM ('ASSESSMENT', 'PRACTICE_TIME');

-- CreateEnum
CREATE TYPE "RecipientRule" AS ENUM ('ALL', 'NOT_MASTERED_DEPENDENCY');

-- CreateEnum
CREATE TYPE "Operation" AS ENUM ('ADD', 'SUB', 'MUL', 'DIV');

-- CreateEnum
CREATE TYPE "Modifier" AS ENUM ('DECIMAL', 'FRACTION');

-- CreateEnum
CREATE TYPE "TeacherPlan" AS ENUM ('TRIAL', 'PRO', 'SCHOOL');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "type" "Type" NOT NULL DEFAULT 'TEST',
    "mode" "Mode" NOT NULL DEFAULT 'SCHEDULED',
    "targetKind" "AssignmentTargetKind" NOT NULL DEFAULT 'ASSESSMENT',
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3),
    "windowMinutes" INTEGER NOT NULL DEFAULT 4,
    "numQuestions" INTEGER NOT NULL DEFAULT 12,
    "operation" "Operation",
    "durationMinutes" INTEGER,
    "scheduleId" INTEGER,
    "runDate" TIMESTAMP(3),
    "parentAssignmentId" INTEGER,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSchedule" (
    "id" SERIAL NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "days" TEXT[],
    "opensAtLocalTime" TEXT NOT NULL,
    "windowMinutes" INTEGER NOT NULL DEFAULT 4,
    "targetKind" "AssignmentTargetKind" NOT NULL DEFAULT 'ASSESSMENT',
    "type" "Type",
    "numQuestions" INTEGER NOT NULL DEFAULT 12,
    "operation" "Operation",
    "durationMinutes" INTEGER,
    "dependsOnScheduleId" INTEGER,
    "offsetMinutes" INTEGER NOT NULL DEFAULT 0,
    "recipientRule" "RecipientRule" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "AssignmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentScheduleRun" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL,
    "assignmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "skippedAt" TIMESTAMP(3),
    "skipReason" TEXT,

    CONSTRAINT "AssignmentScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRecipient" (
    "assignmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentRecipient_pkey" PRIMARY KEY ("assignmentId","studentId")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "operationAtTime" "Operation",
    "levelAtTime" INTEGER,
    "maxNumberAtTime" INTEGER,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptItem" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "operation" "Operation" NOT NULL,
    "operandA" INTEGER NOT NULL,
    "operandB" INTEGER NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "givenAnswer" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "AttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "operationAtTime" "Operation" NOT NULL,
    "levelAtTime" INTEGER NOT NULL,
    "maxNumberAtTime" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "setupCodeHash" TEXT,
    "setupCodeExpiresAt" TIMESTAMP(3),
    "mustSetPassword" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherEntitlement" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "plan" "TeacherPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomProgressionPolicy" (
    "id" SERIAL NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "enabledOperations" "Operation"[],
    "operationOrder" "Operation"[],
    "maxNumber" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassroomProgressionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgress" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "operation" "Operation" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierRule" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER NOT NULL,
    "modifier" "Modifier" NOT NULL,
    "operations" "Operation"[],
    "minLevel" INTEGER NOT NULL,
    "propagate" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_classroomId_idx" ON "Assignment"("classroomId");

-- CreateIndex
CREATE INDEX "Assignment_scheduleId_idx" ON "Assignment"("scheduleId");

-- CreateIndex
CREATE INDEX "Assignment_closesAt_idx" ON "Assignment"("closesAt");

-- CreateIndex
CREATE INDEX "Assignment_classroomId_runDate_idx" ON "Assignment"("classroomId", "runDate");

-- CreateIndex
CREATE INDEX "Assignment_classroomId_type_idx" ON "Assignment"("classroomId", "type");

-- CreateIndex
CREATE INDEX "Assignment_classroomId_opensAt_idx" ON "Assignment"("classroomId", "opensAt");

-- CreateIndex
CREATE INDEX "Assignment_scheduleId_runDate_idx" ON "Assignment"("scheduleId", "runDate");

-- CreateIndex
CREATE INDEX "AssignmentSchedule_classroomId_idx" ON "AssignmentSchedule"("classroomId");

-- CreateIndex
CREATE INDEX "AssignmentSchedule_dependsOnScheduleId_idx" ON "AssignmentSchedule"("dependsOnScheduleId");

-- CreateIndex
CREATE INDEX "AssignmentScheduleRun_scheduleId_idx" ON "AssignmentScheduleRun"("scheduleId");

-- CreateIndex
CREATE INDEX "AssignmentScheduleRun_runDate_idx" ON "AssignmentScheduleRun"("runDate");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentScheduleRun_scheduleId_runDate_key" ON "AssignmentScheduleRun"("scheduleId", "runDate");

-- CreateIndex
CREATE INDEX "AssignmentRecipient_studentId_idx" ON "AssignmentRecipient"("studentId");

-- CreateIndex
CREATE INDEX "AssignmentRecipient_assignmentId_idx" ON "AssignmentRecipient"("assignmentId");

-- CreateIndex
CREATE INDEX "Attempt_assignmentId_idx" ON "Attempt"("assignmentId");

-- CreateIndex
CREATE INDEX "Attempt_studentId_idx" ON "Attempt"("studentId");

-- CreateIndex
CREATE INDEX "Attempt_studentId_completedAt_idx" ON "Attempt"("studentId", "completedAt");

-- CreateIndex
CREATE INDEX "Attempt_assignmentId_completedAt_idx" ON "Attempt"("assignmentId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_studentId_assignmentId_key" ON "Attempt"("studentId", "assignmentId");

-- CreateIndex
CREATE INDEX "AttemptItem_attemptId_idx" ON "AttemptItem"("attemptId");

-- CreateIndex
CREATE INDEX "PracticeSession_studentId_idx" ON "PracticeSession"("studentId");

-- CreateIndex
CREATE INDEX "PracticeSession_startedAt_idx" ON "PracticeSession"("startedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_studentId_startedAt_idx" ON "PracticeSession"("studentId", "startedAt");

-- CreateIndex
CREATE INDEX "Classroom_teacherId_idx" ON "Classroom"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");

-- CreateIndex
CREATE INDEX "Student_classroomId_idx" ON "Student"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSession_token_key" ON "TeacherSession"("token");

-- CreateIndex
CREATE INDEX "TeacherSession_teacherId_idx" ON "TeacherSession"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSession_expiresAt_idx" ON "TeacherSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSession_token_key" ON "StudentSession"("token");

-- CreateIndex
CREATE INDEX "StudentSession_studentId_idx" ON "StudentSession"("studentId");

-- CreateIndex
CREATE INDEX "StudentSession_expiresAt_idx" ON "StudentSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherEntitlement_teacherId_key" ON "TeacherEntitlement"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherEntitlement_plan_idx" ON "TeacherEntitlement"("plan");

-- CreateIndex
CREATE INDEX "TeacherEntitlement_status_idx" ON "TeacherEntitlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomProgressionPolicy_classroomId_key" ON "ClassroomProgressionPolicy"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomProgressionPolicy_classroomId_idx" ON "ClassroomProgressionPolicy"("classroomId");

-- CreateIndex
CREATE INDEX "StudentProgress_studentId_idx" ON "StudentProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgress_studentId_operation_key" ON "StudentProgress"("studentId", "operation");

-- CreateIndex
CREATE INDEX "ModifierRule_policyId_idx" ON "ModifierRule"("policyId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AssignmentSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_parentAssignmentId_fkey" FOREIGN KEY ("parentAssignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSchedule" ADD CONSTRAINT "AssignmentSchedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSchedule" ADD CONSTRAINT "AssignmentSchedule_dependsOnScheduleId_fkey" FOREIGN KEY ("dependsOnScheduleId") REFERENCES "AssignmentSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentScheduleRun" ADD CONSTRAINT "AssignmentScheduleRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AssignmentSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentScheduleRun" ADD CONSTRAINT "AssignmentScheduleRun_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRecipient" ADD CONSTRAINT "AssignmentRecipient_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRecipient" ADD CONSTRAINT "AssignmentRecipient_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptItem" ADD CONSTRAINT "AttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSession" ADD CONSTRAINT "TeacherSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSession" ADD CONSTRAINT "StudentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherEntitlement" ADD CONSTRAINT "TeacherEntitlement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomProgressionPolicy" ADD CONSTRAINT "ClassroomProgressionPolicy_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierRule" ADD CONSTRAINT "ModifierRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ClassroomProgressionPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
