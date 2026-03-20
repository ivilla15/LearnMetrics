import type { EntitlementSourceCode, EntitlementStatusCode, TeacherPlanCode } from '@/types/enums';

export type EntitlementDTO = {
  plan: TeacherPlanCode;
  status: EntitlementStatusCode;
  source: EntitlementSourceCode;
  trialEndsAt: string | null;
  expiresAt: string | null;
  grantReason: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type EntitlementSnapshot = {
  plan: TeacherPlanCode;
  status: EntitlementStatusCode;
  source: EntitlementSourceCode;
  trialEndsAt: Date | null;
  expiresAt: Date | null;
  grantReason: string | null;
};

export type EntitlementAccessState = {
  plan: TeacherPlanCode;
  status: EntitlementStatusCode;
  source: EntitlementSourceCode;
  trialEndsAt: Date | null;
  expiresAt: Date | null;
  grantReason: string | null;
  isActive: boolean;
  isTrial: boolean;
  hasProAccess: boolean;
  isSchoolPlan: boolean;
};

export type EntitlementGateOk = {
  ok: true;
  entitlement: EntitlementSnapshot | null;
};

export type EntitlementGateFail = {
  ok: false;
  status: number;
  error: string;
};

export type EntitlementGateResult = EntitlementGateOk | EntitlementGateFail;

export type SubscriptionSummaryDTO = {
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionStatus: string;
} | null;

export type FeatureGate = {
  ok: boolean;
  message: string;
  upgradeUrl?: string;
};

export type ScheduleGate = FeatureGate;

export type ClassroomsGate = FeatureGate;

export type StudentsGate = FeatureGate;

export type AssignmentsGate = FeatureGate;
