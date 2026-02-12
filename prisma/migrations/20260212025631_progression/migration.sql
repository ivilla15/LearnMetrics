/*
  Warnings:

  - You are about to drop the column `allowDecimals` on the `ClassroomProgressionPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `allowFractions` on the `ClassroomProgressionPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Student` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Modifier" AS ENUM ('DECIMAL', 'FRACTION');

-- AlterTable
ALTER TABLE "ClassroomProgressionPolicy" DROP COLUMN "allowDecimals",
DROP COLUMN "allowFractions";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "level";

-- CreateTable
CREATE TABLE "ModifierRule" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER NOT NULL,
    "operation" "Operation",
    "modifier" "Modifier" NOT NULL,
    "minLevel" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModifierRule_policyId_idx" ON "ModifierRule"("policyId");

-- CreateIndex
CREATE INDEX "ModifierRule_policyId_operation_idx" ON "ModifierRule"("policyId", "operation");

-- CreateIndex
CREATE UNIQUE INDEX "ModifierRule_policyId_operation_modifier_key" ON "ModifierRule"("policyId", "operation", "modifier");

-- AddForeignKey
ALTER TABLE "ModifierRule" ADD CONSTRAINT "ModifierRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ClassroomProgressionPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
