/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * reference-submission-service.ts
 *
 * Referee-side surface for the provider-reference (vouch) system. The referee
 * is UNAUTHENTICATED — the raw single-use token IS the auth. Every function
 * takes a service-role SupabaseClient as a parameter (the route/Inngest fn
 * builds it) and returns a result object rather than throwing.
 *
 * Single-use guarantee: on both submit and decline the invite_token_hash is set
 * to NULL, so a token can never be replayed after the referee has responded.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { hashReferenceToken, isInviteExpired } from "@/lib/reference-tokens";
import { getProviderDisplay } from "@/services/provider/provider-display";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReferenceRow = {
  id: string;
  provider_id: string;
  reference_type: "client" | "peer";
  referee_name: string;
  relationship: string | null;
  status: string;
  invite_expires_at: string | null;
};

export type ResolvedInvitation = {
  state: "valid" | "expired" | "used" | "declined" | "invalid";
  reference?: {
    id: string;
    reference_type: "client" | "peer";
    referee_name: string;
    relationship: string | null;
    requires_work_date: boolean;
  };
  provider?: { displayName: string; trade?: string };
};

export type SubmitReferenceResult =
  | { success: true }
  | { success: false; error: string; state?: "expired" | "used" | "invalid" };

export type DeclineReferenceResult =
  | { success: true }
  | { success: false; error: string; state?: string };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const MIN_REFERENCE_TEXT = 10;

/** User-safe message returned in place of a raw Supabase error string. */
const GENERIC_ERROR = "Something went wrong. Please try again.";

const submitSchema = z.object({
  reference_text: z
    .string()
    .trim()
    .min(MIN_REFERENCE_TEXT, `Please write at least ${MIN_REFERENCE_TEXT} characters.`),
  relationship: z.string().trim().min(1).optional(),
  work_date: z.string().trim().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

// ---------------------------------------------------------------------------
// resolveInvitationByToken
// ---------------------------------------------------------------------------

export async function resolveInvitationByToken(
  supabase: SupabaseClient,
  rawToken: string,
  now: Date = new Date(),
): Promise<ResolvedInvitation> {
  const tokenHash = hashReferenceToken(rawToken);

  const { data, error } = await supabase
    .from("provider_references")
    .select(
      "id, provider_id, reference_type, referee_name, relationship, status, invite_expires_at",
    )
    // Hash equality is compared in the DB (Postgres `=`), not a JS string
    // compare, so no timing-safe comparison (timingSafeEqual) is needed here.
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  const row = data as ReferenceRow | null;

  if (error || !row) return { state: "invalid" };

  // Generic invalid for revoked — no enumeration of the invite's history.
  if (row.status === "revoked") return { state: "invalid" };
  if (row.status === "declined") return { state: "declined" };

  // Already responded (submitted/verified/rejected/flagged) — nothing to do.
  if (["submitted", "verified", "rejected", "flagged"].includes(row.status)) {
    return { state: "used" };
  }

  // Lazy expiry: expire an outstanding pending/sent invite past its window.
  if (row.status === "expired" || isInviteExpired(row.invite_expires_at, now)) {
    if (row.status === "pending" || row.status === "sent") {
      await supabase
        .from("provider_references")
        .update({ status: "expired" })
        .eq("id", row.id);
    }
    return { state: "expired" };
  }

  const display = await getProviderDisplay(supabase, row.provider_id);
  const provider = { displayName: display.providerName, trade: display.providerTrade };

  return {
    state: "valid",
    reference: {
      id: row.id,
      reference_type: row.reference_type,
      referee_name: row.referee_name,
      relationship: row.relationship,
      requires_work_date: row.reference_type === "client",
    },
    provider,
  };
}

// ---------------------------------------------------------------------------
// submitReference
// ---------------------------------------------------------------------------

export async function submitReference(
  supabase: SupabaseClient,
  rawToken: string,
  input: {
    reference_text: string;
    relationship?: string;
    work_date?: string;
    rating?: number;
  },
  now: Date = new Date(),
): Promise<SubmitReferenceResult> {
  const resolved = await resolveInvitationByToken(supabase, rawToken, now);
  if (resolved.state !== "valid" || !resolved.reference) {
    return {
      success: false,
      error: "This invitation is no longer available.",
      state: resolved.state as "expired" | "used" | "invalid",
    };
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { reference_text, relationship, work_date, rating } = parsed.data;
  const isClient = resolved.reference.reference_type === "client";

  if (isClient) {
    if (!work_date) {
      return { success: false, error: "The date the work took place is required." };
    }
    const workDateMs = new Date(work_date).getTime();
    if (Number.isNaN(workDateMs)) {
      return { success: false, error: "Enter a valid work date." };
    }
    if (workDateMs > now.getTime()) {
      return { success: false, error: "The work date can't be in the future." };
    }
  }

  const update: Record<string, unknown> = {
    status: "submitted",
    submitted_at: now.toISOString(),
    reference_text,
    invite_token_hash: null, // hard single-use — token can never be replayed
  };
  if (relationship !== undefined) update.relationship = relationship;
  if (isClient) update.work_date = work_date;
  if (rating !== undefined) update.rating = rating;

  // Serialize concurrent submits at the DB: only match while the token hash is
  // still present, and check affected rows. The FIRST commit NULLs the hash, so
  // a racing second request matches 0 rows and is rejected as already-consumed.
  const { data: affected, error } = await supabase
    .from("provider_references")
    .update(update)
    .eq("id", resolved.reference.id)
    .not("invite_token_hash", "is", null)
    .select("id");

  if (error) {
    console.error("[reference-submission-service] submitReference update failed", {
      referenceId: resolved.reference.id,
      error,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  if (!affected || (affected as unknown[]).length === 0) {
    return {
      success: false,
      state: "used",
      error: "This reference has already been submitted.",
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// declineReference
// ---------------------------------------------------------------------------

export async function declineReference(
  supabase: SupabaseClient,
  rawToken: string,
  reason?: string,
  now: Date = new Date(),
): Promise<DeclineReferenceResult> {
  const resolved = await resolveInvitationByToken(supabase, rawToken, now);
  if (resolved.state !== "valid" || !resolved.reference) {
    return {
      success: false,
      error: "This invitation is no longer available.",
      state: resolved.state,
    };
  }

  // Serialize concurrent responses at the DB (see submitReference): only match
  // while the token hash is still present, and check affected rows.
  const { data: affected, error } = await supabase
    .from("provider_references")
    .update({
      status: "declined",
      declined_at: now.toISOString(),
      declined_reason: reason ?? null,
      invite_token_hash: null, // hard single-use
    })
    .eq("id", resolved.reference.id)
    .not("invite_token_hash", "is", null)
    .select("id");

  if (error) {
    console.error("[reference-submission-service] declineReference update failed", {
      referenceId: resolved.reference.id,
      error,
    });
    return { success: false, error: GENERIC_ERROR };
  }

  if (!affected || (affected as unknown[]).length === 0) {
    return {
      success: false,
      state: "used",
      error: "This reference has already been submitted.",
    };
  }

  return { success: true };
}
