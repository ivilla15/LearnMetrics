/*
  Warnings:

  - The values [FRIDAY_TEST] on the enum `AssignmentKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('SCHEDULED', 'MANUAL');

-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentKind_new" AS ENUM ('SCHEDULED_TEST');
ALTER TABLE "learnmetrics"."Assignment" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "Assignment" ALTER COLUMN "kind" TYPE "AssignmentKind_new" USING ("kind"::text::"AssignmentKind_new");
ALTER TYPE "AssignmentKind" RENAME TO "AssignmentKind_old";
ALTER TYPE "AssignmentKind_new" RENAME TO "AssignmentKind";
DROP TYPE "learnmetrics"."AssignmentKind_old";
ALTER TABLE "Assignment" ALTER COLUMN "kind" SET DEFAULT 'SCHEDULED_TEST';
COMMIT;

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_questionSetId_fkey";

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assignmentMode" "AssignmentMode" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "numQuestions" INTEGER NOT NULL DEFAULT 12,
ALTER COLUMN "questionSetId" DROP NOT NULL,
ALTER COLUMN "kind" SET DEFAULT 'SCHEDULED_TEST';

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "levelAtTime" INTEGER;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "mustSetPassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "setupCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "setupCodeHash" TEXT;

-- CreateTable
CREATE TABLE "AssignmentSchedule" (
    "id" SERIAL NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "opensAtLocalTime" TEXT NOT NULL,
    "windowMinutes" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "days" TEXT[],
    "numQuestions" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "AssignmentSchedule_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "AssignmentSchedule_classroomId_idx" ON "AssignmentSchedule"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSession_token_key" ON "TeacherSession"("token");

-- CreateIndex
CREATE INDEX "TeacherSession_teacherId_idx" ON "TeacherSession"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSession_token_key" ON "StudentSession"("token");

-- CreateIndex
CREATE INDEX "StudentSession_studentId_idx" ON "StudentSession"("studentId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSchedule" ADD CONSTRAINT "AssignmentSchedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSession" ADD CONSTRAINT "TeacherSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSession" ADD CONSTRAINT "StudentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
