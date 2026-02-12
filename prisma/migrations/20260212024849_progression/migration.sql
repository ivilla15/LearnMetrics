-- CreateEnum
CREATE TYPE "Operation" AS ENUM ('ADD', 'SUB', 'MUL', 'DIV');

-- AlterTable
ALTER TABLE "Assignment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ClassroomProgressionPolicy" (
    "id" SERIAL NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "enabledOperations" "Operation"[],
    "maxNumber" INTEGER NOT NULL DEFAULT 12,
    "allowDecimals" BOOLEAN NOT NULL DEFAULT false,
    "allowFractions" BOOLEAN NOT NULL DEFAULT false,
    "divisionIntegersOnly" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomProgressionPolicy_classroomId_key" ON "ClassroomProgressionPolicy"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomProgressionPolicy_classroomId_idx" ON "ClassroomProgressionPolicy"("classroomId");

-- CreateIndex
CREATE INDEX "StudentProgress_studentId_idx" ON "StudentProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgress_studentId_operation_key" ON "StudentProgress"("studentId", "operation");

-- AddForeignKey
ALTER TABLE "ClassroomProgressionPolicy" ADD CONSTRAINT "ClassroomProgressionPolicy_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
