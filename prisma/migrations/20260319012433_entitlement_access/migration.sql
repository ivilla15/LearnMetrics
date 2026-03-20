-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('TRIAL', 'STRIPE', 'COMP', 'INTERNAL', 'SCHOOL');

-- AlterTable
ALTER TABLE "TeacherEntitlement" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "grantReason" TEXT,
ADD COLUMN     "source" "EntitlementSource" NOT NULL DEFAULT 'TRIAL';
