/*
  Warnings:

  - A unique constraint covering the columns `[classroomId,kind,opensAt]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `closesAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `opensAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssignmentKind" AS ENUM ('FRIDAY_TEST');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "closesAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "kind" "AssignmentKind" NOT NULL DEFAULT 'FRIDAY_TEST',
ADD COLUMN     "opensAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "windowMinutes" INTEGER NOT NULL DEFAULT 4;

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_classroomId_kind_opensAt_key" ON "Assignment"("classroomId", "kind", "opensAt");
