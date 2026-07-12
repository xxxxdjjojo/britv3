/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * reference-invitation-service.ts
 *
 * Trader-side lifecycle for provider-reference (vouch) invitations.
 *
 * ARCHITECTURE: raw token generation lives in the T7 Inngest function, NOT here.
 * `createReferenceInvitation` inserts a `pending` row with NO token; the API
 * route emits an Inngest event; the Inngest function generates the token, calls
 * `markSentReference` to persist the hash + expiry + sent-state, and sends the
 * email. This keeps the raw token off any queue and stops the DB disagreeing
 * with the email.
 *
 * Every function takes an already-constructed service-role SupabaseClient as a
 * parameter — it never builds the client itself — and returns a result object
 * rather than throwing for expected errors.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { VouchRules } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hard ceiling on total sends (initial + resends) per invitation. */
const MAX_RESENDS = 5;

const MS_PER_HOUR = 60 * 60 * 1000;

/** User-safe message returned in place of a raw Supabase error string. */
const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Statuses from which an invite can be resent or cancelled. */
const RESENDABLE_STATUSES = ["pending", "sent"] as const;
const CANCELLABLE_STATUSES = ["pending", "sent"] as const;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type CreateInvitationResult =
  | { success: true; id: string }
  | { success: false; error: string; code?: "duplicate" | "self_vouch" | "invalid" };

export type ResendInvitationResult =
  | { success: true }
  | {
      success: false;
      error: string;
      code?: "not_found" | "not_resendable" | "cooldown" | "max_sends";
    };

export type CancelInvitationResult =
  | { success: true }
  | { success: false; error: string; code?: "not_found" | "not_cancellable" };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const createSchema = z.object({
  referee_name: z.string().trim().min(1, "Referee name is required."),
  referee_email: z.string().trim().email("Enter a valid email address."),
  reference_type: z.enum(["client", "peer"]),
  relationship: z.string().trim().min(1).optional(),
});

// ---------------------------------------------------------------------------
// createReferenceInvitation
// ---------------------------------------------------------------------------

export async function createReferenceInvitation(
  supabase: SupabaseClient,
  params: {
    providerId: string;
    providerEmail: string;
    referee_name: string;
    referee_email: string;
    reference_type: "client" | "peer";
    relationship?: string;
  },
): Promise<CreateInvitationResult> {
  const parsed = createSchema.safeParse({
    referee_name: params.referee_name,
    referee_email: params.referee_email,
    reference_type: params.reference_type,
    relationship: params.relationship,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { success: false, code: "invalid", error: issue?.message ?? "Invalid input." };
  }

  const { referee_name, referee_email, reference_type, relationship } = parsed.data;

  // Self-vouch guard (case-insensitive).
  if (referee_email.toLowerCase() === params.providerEmail.trim().toLowerCase()) {
    return {
      success: false,
      code: "self_vouch",
      error: "You can't request a reference from your own email address.",
    };
  }

  const { data, error } = await supabase
    .from("provider_references")
    .insert({
      provider_id: params.providerId,
      reference_type,
      referee_name,
      referee_email,
      relationship: relationship ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    // Unique-violation from the active-invite partial index.
    if ((error as { code?: string }).code === "23505") {
      return {
        success: false,
        code: "duplicate",
        error: "An active invitation already exists for this email and reference type.",
      };
    }
    console.error("[reference-invitation-service] createReferenceInvitation insert failed", {
      providerId: params.providerId,
      error,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, id: (data as { id: string }).id };
}

// ---------------------------------------------------------------------------
// resendReferenceInvitation
// ---------------------------------------------------------------------------

type InviteRow = {
  id: string;
  provider_id: string;
  status: string;
  invite_last_sent_at: string | null;
  invite_send_count: number;
};

/**
 * Validates resend eligibility only. Does NOT rotate the token — the API route
 * emits a resend event and the T7 Inngest function rotates the token, re-sends,
 * and calls markSentReference.
 */
export async function resendReferenceInvitation(
  supabase: SupabaseClient,
  params: { referenceId: string; providerId: string; rules: VouchRules },
  now: Date = new Date(),
): Promise<ResendInvitationResult> {
  const { data, error } = await supabase
    .from("provider_references")
    .select("id, provider_id, status, invite_last_sent_at, invite_send_count")
    .eq("id", params.referenceId)
    .maybeSingle();

  const row = data as InviteRow | null;

  // Not found / not owned — same generic response, never leak existence.
  if (error || !row || row.provider_id !== params.providerId) {
    return { success: false, code: "not_found", error: "Invitation not found." };
  }

  if (!RESENDABLE_STATUSES.includes(row.status as (typeof RESENDABLE_STATUSES)[number])) {
    return {
      success: false,
      code: "not_resendable",
      error: "This invitation can no longer be resent.",
    };
  }

  if ((row.invite_send_count ?? 0) >= MAX_RESENDS) {
    return {
      success: false,
      code: "max_sends",
      error: "This invitation has reached its resend limit.",
    };
  }

  if (row.invite_last_sent_at) {
    const cooldownMs = params.rules.resend_cooldown_hours * MS_PER_HOUR;
    const nextAllowed = new Date(row.invite_last_sent_at).getTime() + cooldownMs;
    if (now.getTime() < nextAllowed) {
      return {
        success: false,
        code: "cooldown",
        error: "Please wait before resending this invitation.",
      };
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// cancelReferenceInvitation
// ---------------------------------------------------------------------------

export async function cancelReferenceInvitation(
  supabase: SupabaseClient,
  params: { referenceId: string; providerId: string },
  now: Date = new Date(),
): Promise<CancelInvitationResult> {
  const { data, error } = await supabase
    .from("provider_references")
    .select("id, provider_id, status")
    .eq("id", params.referenceId)
    .maybeSingle();

  const row = data as { id: string; provider_id: string; status: string } | null;

  if (error || !row || row.provider_id !== params.providerId) {
    return { success: false, code: "not_found", error: "Invitation not found." };
  }

  if (!CANCELLABLE_STATUSES.includes(row.status as (typeof CANCELLABLE_STATUSES)[number])) {
    return {
      success: false,
      code: "not_cancellable",
      error: "This invitation can no longer be cancelled.",
    };
  }

  const { error: updateError } = await supabase
    .from("provider_references")
    .update({ status: "revoked", revoked_at: now.toISOString() })
    .eq("id", params.referenceId)
    .eq("provider_id", params.providerId);

  if (updateError) {
    console.error("[reference-invitation-service] cancelReferenceInvitation update failed", {
      referenceId: params.referenceId,
      providerId: params.providerId,
      error: updateError,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// markSentReference
// ---------------------------------------------------------------------------

/**
 * Single writer of send-state. Persists the token hash + expiry and flips the
 * invite to `sent`, preserving the original invite_sent_at and bumping the
 * send counter.
 *
 * NOTE (counter race): this reads-then-writes invite_send_count. Under real
 * concurrency two simultaneous sends could both read N and both write N+1,
 * under-counting by one. Sends of a single invite are effectively serial (a
 * human clicking resend, gated by the cooldown), so a lost increment here is
 * acceptable. If that ever changes, move the increment into an atomic SQL
 * expression or an RPC.
 */
export async function markSentReference(
  supabase: SupabaseClient,
  referenceId: string,
  opts: { tokenHash: string; expiresAt: string },
  now: Date = new Date(),
): Promise<{ success: true } | { success: false; error: string }> {
  const nowIso = now.toISOString();

  const { data: current, error: fetchError } = await supabase
    .from("provider_references")
    .select("invite_sent_at, invite_send_count")
    .eq("id", referenceId)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const row = current as { invite_sent_at: string | null; invite_send_count: number | null };

  const { error: updateError } = await supabase
    .from("provider_references")
    .update({
      invite_token_hash: opts.tokenHash,
      invite_expires_at: opts.expiresAt,
      invite_sent_at: row.invite_sent_at ?? nowIso, // COALESCE(existing, now)
      invite_last_sent_at: nowIso,
      invite_send_count: (row.invite_send_count ?? 0) + 1,
      status: "sent",
    })
    .eq("id", referenceId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
