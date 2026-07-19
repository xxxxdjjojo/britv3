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
  const { data, error } = await admin.rpc("create_vouch_request", {
    p_provider_id: input.providerId,
    p_voucher_kind: input.voucherKind,
    p_invited_email: email,
  });
  const row = first(data as Array<{ id: string; invite_token: string }> | null);
  if (error || !row) throw new Error(`Vouch request creation failed: ${error?.message ?? "missing row"}`);
  captureBusinessEvent("vouch_request_sent", input.providerId, { voucherKind: input.voucherKind });
  return { id: row.id, inviteToken: row.invite_token };
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
      trade: details?.services?.[0] ?? "Service provider",
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
  const result = first(data as { outcome: string; vouch_id?: string; gate_just_completed?: boolean; provider_id?: string }[] | null);
  if (input.decision === "accept") {
    captureBusinessEvent("vouch_accepted", input.actorProfileId);
  }
  if (result?.gate_just_completed) {
    captureBusinessEvent("gate_completed", result.provider_id ?? input.actorProfileId);
  }
  return { outcome: result?.outcome ?? input.decision, vouchId: result?.vouch_id };
}

export async function revokeVouchRequest(providerId: string, requestId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("revoke_vouch_request", {
    p_request_id: requestId,
    p_provider_id: providerId,
  });
  if (error) throw new Error(`Vouch request revocation failed: ${error.message}`);
}

export async function getVouchGateStatus(profileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("vouch_gate_status", { p_profile_id: profileId });
  if (error) throw new Error(`Vouch gate lookup failed: ${error.message}`);
  const row = first(data as Array<{ peer_count: number; client_count: number; grandfathered: boolean; gate_complete: boolean }> | null);
  return row ?? { peer_count: 0, client_count: 0, grandfathered: false, gate_complete: false };
}

export type VouchRequestListItem = Readonly<{
  id: string;
  voucherKind: VoucherKind;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  requestedAt: string;
  expiresAt: string;
}>;

export async function listVouchRequests(providerId: string): Promise<VouchRequestListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vouch_requests")
    .select("id, voucher_kind, status, requested_at, expires_at")
    .eq("provider_id", providerId)
    .order("requested_at", { ascending: false });
  if (error) throw new Error(`Vouch request list failed: ${error.message}`);
  const rows = (data ?? []) as Array<{
    id: string;
    voucher_kind: VoucherKind;
    status: VouchRequestListItem["status"];
    requested_at: string;
    expires_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    voucherKind: row.voucher_kind,
    status: row.status,
    requestedAt: row.requested_at,
    expiresAt: row.expires_at,
  }));
}

export async function createReferralInvite(input: Readonly<{
  referrerId: string;
  invitedEmail: string;
}>): Promise<{ id: string; inviteToken: string; url: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_provider_referral_invite", {
    p_referrer_id: input.referrerId,
    p_invited_email: input.invitedEmail.trim().toLowerCase(),
  });
  const row = first(data as Array<{ id: string; invite_token: string }> | null);
  if (error || !row) throw new Error(`Referral invite creation failed: ${error?.message ?? "missing row"}`);
  const inviteToken = row.invite_token;
  return { id: row.id, inviteToken, url: `/join?invite=${inviteToken}` };
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

export function trackReferralCreditApplied(memberId: string, referralId: string, creditMonths: number): void {
  captureBusinessEvent("credit_applied", memberId, { referralId, creditMonths });
}

export async function issueReferralCredit(referralId: string, memberId: string, creditMonths = 1) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("issue_referral_credit", {
    p_referral_id: referralId,
    p_member_id: memberId,
    p_credit_months: creditMonths,
  });
  if (error) throw new Error(`Referral credit issuance failed: ${error.message}`);
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
