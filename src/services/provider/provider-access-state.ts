import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderAccessState } from "./provider-access-policy";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const PROVIDER_SUBSCRIPTION_ROLES = new Set(["provider", "service_provider"]);

type GateStatusRow = {
  peer_count: number;
  client_count: number;
  grandfathered: boolean;
  gate_complete: boolean;
};

export class ProviderAccessStateUnavailableError extends Error {
  constructor(public readonly cause: unknown) {
    super("Provider access state is unavailable");
    this.name = "ProviderAccessStateUnavailableError";
  }
}

export async function getProviderAccessState(
  supabase: SupabaseClient,
  userId: string,
  options: { emailConfirmed: boolean; roleHint?: string | null },
): Promise<ProviderAccessState> {
  try {
    const [profileResult, gateResult, subscriptionResult, connectResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("active_role, provider_verification_status")
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc("vouch_gate_status", { p_profile_id: userId }),
        supabase
          .from("subscriptions")
          .select("status, role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("stripe_connect_accounts")
          .select("charges_enabled, payouts_enabled")
          .eq("provider_id", userId)
          .maybeSingle(),
      ]);

    const firstError = [
      profileResult.error,
      gateResult.error,
      subscriptionResult.error,
      connectResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const profile = profileResult.data as {
      active_role: string | null;
      provider_verification_status: string | null;
    } | null;
    if (!profile) throw new Error("Provider profile is missing");

    const gate = ((gateResult.data as GateStatusRow[] | null)?.[0] ?? null);
    if (!gate) throw new Error("Provider vouch status is missing");

    const subscription = subscriptionResult.data as {
      status: string;
      role: string | null;
    } | null;
    const connect = connectResult.data as {
      charges_enabled: boolean;
      payouts_enabled: boolean;
    } | null;

    return {
      // The database role is authoritative. A JWT hint must never grant a
      // provider capability after the user's active role changes.
      role: profile.active_role,
      emailConfirmed: options.emailConfirmed,
      adminVerified: profile.provider_verification_status === "verified",
      peerVouchCount: gate.peer_count,
      clientVouchCount: gate.client_count,
      grandfathered: gate.grandfathered,
      vouchComplete: gate.gate_complete,
      subscriptionActive:
        !!subscription &&
        ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) &&
        PROVIDER_SUBSCRIPTION_ROLES.has(subscription.role ?? ""),
      stripeConnectReady:
        connect?.charges_enabled === true && connect.payouts_enabled === true,
    };
  } catch (error) {
    if (error instanceof ProviderAccessStateUnavailableError) throw error;
    throw new ProviderAccessStateUnavailableError(error);
  }
}
