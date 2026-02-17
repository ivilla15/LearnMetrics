/*
  Warnings:

  - You are about to drop the column `divisionIntegersOnly` on the `ClassroomProgressionPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `operation` on the `ModifierRule` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ModifierRule_policyId_operation_idx";

-- DropIndex
DROP INDEX "ModifierRule_policyId_operation_modifier_key";

-- AlterTable
ALTER TABLE "ClassroomProgressionPolicy" DROP COLUMN "divisionIntegersOnly",
ADD COLUMN     "operationOrder" "Operation"[];

-- AlterTable
ALTER TABLE "ModifierRule" DROP COLUMN "operation",
ADD COLUMN     "operations" "Operation"[],
ADD COLUMN     "propagate" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "minLevel" DROP DEFAULT;
