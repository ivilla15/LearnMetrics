export type EntitlementDTO = {
  plan: 'TRIAL' | 'PRO' | 'SCHOOL';
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type SubscriptionSummary = {
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionStatus: string;
} | null;
