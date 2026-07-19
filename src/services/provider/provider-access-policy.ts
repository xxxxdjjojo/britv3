export type ProviderAccessRequirement = "progress" | "business" | "transaction";

export type ProviderAccessState = {
  role: string | null;
  emailConfirmed: boolean;
  adminVerified: boolean;
  peerVouchCount: number;
  clientVouchCount: number;
  grandfathered: boolean;
  vouchComplete: boolean;
  subscriptionActive: boolean;
  stripeConnectReady: boolean;
};

export type ProviderAccessReason =
  | "wrong_role"
  | "email_unverified"
  | "admin_unverified"
  | "vouch_incomplete"
  | "subscription_inactive"
  | "stripe_connect_incomplete";

export type ProviderAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: ProviderAccessReason };

const SAFE_PROVIDER_PATHS = [
  "/dashboard/provider/verification",
  "/dashboard/provider/referrals",
  "/dashboard/provider/billing",
  "/dashboard/provider/account",
  "/dashboard/provider/settings",
  "/dashboard/provider/help",
] as const;

export function providerRequirementForPath(
  pathname: string,
): ProviderAccessRequirement {
  if (pathname === "/dashboard/provider") return "progress";
  if (
    SAFE_PROVIDER_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return "progress";
  }
  return "business";
}

export function isVouchGateBypassed(): boolean {
  return process.env.VOUCH_GATE_BYPASS === "true";
}

export function evaluateProviderAccess(
  state: ProviderAccessState,
  requirement: ProviderAccessRequirement,
  options: { vouchGateBypass?: boolean } = {},
): ProviderAccessDecision {
  if (state.role !== "service_provider") {
    return { allowed: false, reason: "wrong_role" };
  }

  if (requirement === "progress") return { allowed: true };
  if (!state.emailConfirmed) {
    return { allowed: false, reason: "email_unverified" };
  }
  if (!state.adminVerified) {
    return { allowed: false, reason: "admin_unverified" };
  }
  if (!options.vouchGateBypass && !state.vouchComplete) {
    return { allowed: false, reason: "vouch_incomplete" };
  }
  if (!state.subscriptionActive) {
    return { allowed: false, reason: "subscription_inactive" };
  }
  if (requirement === "transaction" && !state.stripeConnectReady) {
    return { allowed: false, reason: "stripe_connect_incomplete" };
  }
  return { allowed: true };
}
