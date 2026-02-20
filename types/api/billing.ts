import type { EntitlementStatusCode, TeacherPlanCode } from '@/types/enums';

export type EntitlementDTO = {
  plan: TeacherPlanCode;
  status: EntitlementStatusCode;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type SubscriptionSummaryDTO = {
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionStatus: string;
} | null;
