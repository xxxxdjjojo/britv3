import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { posthogServer } from "@/lib/analytics/posthog-server";

type VoucherKind = "peer" | "client";

function captureBusinessEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {},
): void {
  try {
    posthogServer?.capture?.({ event, distinctId, properties });
  } catch {
    // Telemetry is deliberately outside the durable business transaction.
  }
}

function first<T>(data: T | T[] | null): T | null {
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function createVouchRequest(input: Readonly<{
  providerId: string;
  voucherKind: VoucherKind;
  invitedEmail: string;
}>): Promise<{ id: string; inviteToken: string }> {
  const admin = createAdminClient();
  const email = input.invitedEmail.trim().toLowerCase();
  const { data, error } = await admin
    .from("vouch_requests")
    .insert({ provider_id: input.providerId, voucher_kind: input.voucherKind, invited_email: email })
    .select("id, invite_token")
    .single();
  if (error || !data) throw new Error(`Vouch request creation failed: ${error?.message ?? "missing row"}`);
  captureBusinessEvent("vouch_request_sent", input.providerId, { voucherKind: input.voucherKind });
  return { id: data.id, inviteToken: data.invite_token };
}

export type SafeVouchInvite = Readonly<{
  provider: { displayName: string; businessName: string; trade: string };
  voucherKind: VoucherKind;
  status: string;
  expiresAt: string;
}>;

export async function getVouchInvite(token: string): Promise<SafeVouchInvite | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vouch_requests")
    .select("id, provider_id, voucher_kind, invited_email, status, expires_at, profiles!vouch_requests_provider_id_fkey(display_name, service_provider_details(business_name, services))")
    .eq("invite_token", token)
    .maybeSingle();
  if (error) throw new Error(`Vouch invite lookup failed: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as {
    voucher_kind: VoucherKind;
    status: string;
    expires_at: string;
    profiles?: { display_name?: string | null; service_provider_details?: { business_name?: string | null; services?: string[] | null } | null } | null;
    service_provider_details?: { business_name?: string | null; services?: string[] | null; primary_trade?: string | null } | null;
  };
  const details = row.service_provider_details ?? row.profiles?.service_provider_details;
  return {
    provider: {
      displayName: row.profiles?.display_name ?? "TrueDeed provider",
      businessName: details?.business_name ?? "Independent provider",
      trade: details?.primary_trade ?? details?.services?.[0] ?? "Service provider",
    },
    voucherKind: row.voucher_kind,
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export async function respondToVouch(input: Readonly<{
  token: string;
  actorProfileId: string;
  decision: "accept" | "decline";
  publicAttributionConsent?: boolean;
}>): Promise<{ outcome: string; vouchId?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("respond_to_vouch_request", {
    p_invite_token: input.token,
    p_actor_profile_id: input.actorProfileId,
    p_decision: input.decision,
    p_public_attribution_consent: input.publicAttributionConsent ?? false,
  });
  if (error) throw new Error(`Vouch response failed: ${error.message}`);
  const result = first(data as { outcome: string; vouch_id?: string }[] | null);
  if (input.decision === "accept") {
    captureBusinessEvent("vouch_accepted", input.actorProfileId);
  }
  return { outcome: result?.outcome ?? input.decision, vouchId: result?.vouch_id };
}

export async function revokeVouchRequest(providerId: string, vouchId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("revoke_vouch", { p_vouch_id: vouchId, p_provider_id: providerId });
  if (error) throw new Error(`Vouch revocation failed: ${error.message}`);
}

export async function getVouchGateStatus(profileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("vouch_gate_status", { p_profile_id: profileId });
  if (error) throw new Error(`Vouch gate lookup failed: ${error.message}`);
  const row = first(data as Array<{ peer_count: number; client_count: number; grandfathered: boolean; gate_complete: boolean }> | null);
  if (row?.gate_complete) captureBusinessEvent("gate_completed", profileId);
  return row ?? { peer_count: 0, client_count: 0, grandfathered: false, gate_complete: false };
}

export async function createReferralInvite(input: Readonly<{
  referrerId: string;
  invitedEmail: string;
}>): Promise<{ id: string; inviteToken: string; url: string }> {
  const admin = createAdminClient();
  const inviteToken = crypto.randomUUID();
  const { data, error } = await admin.from("referrals").insert({
    referrer_id: input.referrerId,
    referral_code: inviteToken.replaceAll("-", "").slice(0, 12).toUpperCase(),
    track: "trade_to_trade",
    status: "pending",
    provider_state: "invited",
    invite_token: inviteToken,
    invited_email: input.invitedEmail.trim().toLowerCase(),
  }).select("id").single();
  if (error || !data) throw new Error(`Referral invite creation failed: ${error?.message ?? "missing row"}`);
  return { id: data.id, inviteToken, url: `/join?invite=${inviteToken}` };
}

export async function advanceProviderReferral(referralId: string, referredProfileId: string, targetState: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("advance_provider_referral", {
    p_referral_id: referralId,
    p_referred_profile_id: referredProfileId,
    p_target_state: targetState,
  });
  if (error) throw new Error(`Referral transition failed: ${error.message}`);
  if (targetState === "converted") {
    captureBusinessEvent("referral_converted", referredProfileId, { referralId });
  }
  return data;
}

export async function issueReferralCredit(referralId: string, memberId: string, creditMonths = 1) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("issue_referral_credit", {
    p_referral_id: referralId,
    p_member_id: memberId,
    p_credit_months: creditMonths,
  });
  if (error) throw new Error(`Referral credit issuance failed: ${error.message}`);
  captureBusinessEvent("credit_applied", memberId, { referralId, creditMonths });
  return data;
}

export type ReferralAttributionInput = Readonly<{
  userId: string;
  referralCode?: string;
  inviteToken?: string;
}>;

export async function attributeReferralAfterAuthentication(
  input: ReferralAttributionInput,
): Promise<{ attributed: boolean; outcome: string }> {
  if (!input.referralCode && !input.inviteToken) {
    return { attributed: false, outcome: "no_attribution" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("attribute_referral_signup", {
    p_referred_profile_id: input.userId,
    p_referral_code: input.referralCode ?? null,
    p_invite_token: input.inviteToken ?? null,
  });
  if (error) throw new Error(`Referral attribution failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  const outcome = (row as { outcome?: string } | null)?.outcome ?? "no_attribution";
  return { attributed: outcome === "attributed", outcome };
}
