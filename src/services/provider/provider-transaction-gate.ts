import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  evaluateProviderAccess,
  isVouchGateBypassed,
  type ProviderAccessReason,
} from "./provider-access-policy";
import { getProviderAccessState } from "./provider-access-state";

export type TransactionGateReason =
  | ProviderAccessReason
  | "provider_access_unavailable";

export type TransactionGateResult =
  | { allowed: true }
  | { allowed: false; reason: TransactionGateReason; message: string };

const MESSAGES: Record<TransactionGateReason, string> = {
  wrong_role: "Only service providers can perform this action.",
  email_unverified:
    "Verify your email address before sending quotes or invoices.",
  admin_unverified:
    "Your trader account is awaiting admin approval. You can transact once approved.",
  vouch_incomplete:
    "Complete your client and peer vouches before transacting.",
  subscription_inactive:
    "An active subscription is required to send quotes, issue invoices, or take payment.",
  stripe_connect_incomplete:
    "Connect your Stripe payout account before sending invoices or taking payment.",
  provider_access_unavailable:
    "We could not verify your provider access. Please try again.",
};

function blocked(reason: TransactionGateReason): TransactionGateResult {
  return { allowed: false, reason, message: MESSAGES[reason] };
}

export async function checkProviderCanTransact(
  supabase: SupabaseClient,
  userId: string,
  opts: { emailConfirmed: boolean },
): Promise<TransactionGateResult> {
  try {
    const state = await getProviderAccessState(supabase, userId, {
      emailConfirmed: opts.emailConfirmed,
      roleHint: "service_provider",
    });
    const decision = evaluateProviderAccess(state, "transaction", {
      vouchGateBypass: isVouchGateBypassed(),
    });
    return decision.allowed ? { allowed: true } : blocked(decision.reason);
  } catch {
    return blocked("provider_access_unavailable");
  }
}
