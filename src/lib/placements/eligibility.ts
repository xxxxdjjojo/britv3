/**
 * eligibility.ts
 *
 * Pure eligibility rules shared by the purchase flow, the ranking RPC's intent,
 * and the surfacing layer. Two distinct questions:
 *
 *  - canPurchaseBoost: may this trader BUY a placement right now?
 *      verified + active base subscription + not suspended.
 *  - isPlacementLive: should this purchased placement be SHOWN right now?
 *      status active + inside its date window.
 */

export type VerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "suspended"
  | "rejected";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "inactive"
  | "past_due"
  | "canceled"
  | "unpaid";

export type PlacementStatus = "pending_review" | "active" | "paused" | "cancelled" | "rejected" | "expired";

export type EligibilityResult = {
  eligible: boolean;
  /** Machine-readable reasons a trader is blocked: "verification" | "subscription". */
  reasons: string[];
};

const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing"]);

export function canPurchaseBoost(input: {
  verificationStatus: VerificationStatus;
  subscriptionStatus: SubscriptionStatus;
}): EligibilityResult {
  const reasons: string[] = [];
  if (input.verificationStatus !== "verified") reasons.push("verification");
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(input.subscriptionStatus)) reasons.push("subscription");
  return { eligible: reasons.length === 0, reasons };
}

export function isPlacementLive(
  placement: { status: PlacementStatus; startsAt: string; endsAt: string | null },
  now: Date = new Date(),
): boolean {
  if (placement.status !== "active") return false;
  const start = new Date(placement.startsAt).getTime();
  if (now.getTime() < start) return false;
  if (placement.endsAt) {
    const end = new Date(placement.endsAt).getTime();
    if (now.getTime() >= end) return false;
  }
  return true;
}
