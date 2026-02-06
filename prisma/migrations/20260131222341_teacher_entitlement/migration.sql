-- CreateEnum
CREATE TYPE "TeacherPlan" AS ENUM ('TRIAL', 'PRO', 'SCHOOL');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');

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

-- CreateIndex
CREATE UNIQUE INDEX "TeacherEntitlement_teacherId_key" ON "TeacherEntitlement"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherEntitlement_plan_idx" ON "TeacherEntitlement"("plan");

-- CreateIndex
CREATE INDEX "TeacherEntitlement_status_idx" ON "TeacherEntitlement"("status");

-- AddForeignKey
ALTER TABLE "TeacherEntitlement" ADD CONSTRAINT "TeacherEntitlement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
