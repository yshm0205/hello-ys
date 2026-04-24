type PaymentKind = "initial_program" | "credit_topup";

export const GRANT_POLICY_VERSION = "2026-04-24";
export const REFUND_POLICY_VERSION = "2026-04-23";

type GrantSnapshotInput = {
  paymentKind: PaymentKind;
  chargedAmount: number;
  grantedSubscriptionCredits?: number;
  grantedPurchasedCredits?: number;
  planType?: string | null;
  userPlanType?: string | null;
  monthlyCredits?: number | null;
  months?: number | null;
  earlybirdTier?: string | null;
};

type MetadataRecord = Record<string, unknown> | null | undefined;

export function buildGrantSnapshotMetadata(input: GrantSnapshotInput) {
  const grantedSubscriptionCredits = Math.max(
    0,
    Number(input.grantedSubscriptionCredits ?? 0),
  );
  const grantedPurchasedCredits = Math.max(0, Number(input.grantedPurchasedCredits ?? 0));
  const grantedTotalCredits = grantedSubscriptionCredits + grantedPurchasedCredits;

  return {
    grantPolicyVersion: GRANT_POLICY_VERSION,
    refundPolicyVersion: REFUND_POLICY_VERSION,
    chargedAmountAtPurchase: Number(input.chargedAmount || 0),
    grantedTotalCredits,
    grantedSubscriptionCredits,
    grantedPurchasedCredits,
    subscriptionGranted: grantedSubscriptionCredits,
    purchasedGranted: grantedPurchasedCredits,
    initialCredits: grantedSubscriptionCredits,
    earlybirdBonusCredits:
      input.paymentKind === "initial_program" ? grantedPurchasedCredits : 0,
    ...(input.planType != null ? { planType: input.planType } : {}),
    ...(input.userPlanType != null ? { userPlanType: input.userPlanType } : {}),
    ...(input.monthlyCredits != null ? { monthlyCredits: input.monthlyCredits } : {}),
    ...(input.months != null ? { months: input.months } : {}),
    ...(input.earlybirdTier != null ? { earlybirdTier: input.earlybirdTier } : {}),
  };
}

function readNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Number(value);
}

export function getStoredGrantedPurchasedCredits(
  metadata: MetadataRecord,
  fallback = 0,
) {
  const rawValue =
    readNumber(metadata?.grantedPurchasedCredits) ??
    readNumber(metadata?.purchasedGranted) ??
    readNumber(metadata?.earlybirdBonusCredits) ??
    readNumber(metadata?.packCredits) ??
    fallback;

  return Math.max(0, Number(rawValue || 0));
}

export function getStoredGrantedSubscriptionCredits(
  metadata: MetadataRecord,
  fallback = 0,
) {
  const rawValue =
    readNumber(metadata?.grantedSubscriptionCredits) ??
    readNumber(metadata?.subscriptionGranted) ??
    readNumber(metadata?.initialCredits) ??
    fallback;

  return Math.max(0, Number(rawValue || 0));
}

export function getStoredGrantedTotalCredits(
  metadata: MetadataRecord,
  fallback = 0,
) {
  const direct =
    readNumber(metadata?.grantedTotalCredits) ??
    readNumber(metadata?.grantedCredits);

  if (direct !== null) {
    return Math.max(0, direct);
  }

  const fromParts =
    getStoredGrantedSubscriptionCredits(metadata, 0) +
    getStoredGrantedPurchasedCredits(metadata, 0);

  if (fromParts > 0) {
    return fromParts;
  }

  return Math.max(0, Number(fallback || 0));
}
