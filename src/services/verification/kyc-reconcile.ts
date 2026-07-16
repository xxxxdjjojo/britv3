/**
 * Webhook-lag fallback: when a trader returns from the Didit hosted flow and
 * their profile is still 'pending', fetch the session decision directly and
 * apply a terminal outcome. The webhook remains the primary writer — this
 * only closes the gap for the user staring at the page. Errors are swallowed:
 * a failed reconcile just means the page shows "under review" until the
 * webhook lands.
 */

import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapDiditStatus } from "@/services/verification/didit-status-map";

const DECISION_URL = (sessionId: string) =>
  `https://verification.didit.me/v3/session/${sessionId}/decision/`;

export async function reconcilePendingKyc(userId: string): Promise<void> {
  if (env.KYC_PROVIDER !== "didit" || !env.KYC_API_KEY) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("kyc_status, kyc_provider_ref")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.kyc_status !== "pending" || !profile.kyc_provider_ref) {
    return;
  }

  try {
    const res = await fetch(DECISION_URL(profile.kyc_provider_ref), {
      headers: { "x-api-key": env.KYC_API_KEY },
    });
    if (!res.ok) return;

    const decision = (await res.json()) as { status?: string };
    const mapped = mapDiditStatus(decision.status);
    if (!mapped || mapped === "pending") return;

    await admin
      .from("profiles")
      .update({ kyc_status: mapped })
      .eq("id", userId)
      .eq("kyc_provider_ref", profile.kyc_provider_ref);
  } catch {
    // Swallow — the webhook is the source of truth.
  }
}
