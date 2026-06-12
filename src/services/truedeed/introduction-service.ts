/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed introduction-ledger service (Phase 1).
 *
 * Records the FIRST registered contact between an applicant and a listing
 * ("the introduction") plus the subsequent event trail. The ledger row is
 * immutable evidence: applicant name/email are snapshotted at insert time,
 * occurred_at is server-set, and tail_expires_at = occurred_at + 6 months.
 *
 * Idempotency: the introductions table is unique on (applicant_id,
 * listing_id). We resolve any existing introduction up front (cheap indexed
 * lookup), attempt the insert, and on a 23505 unique violation append an
 * introduction_events row against the existing introduction instead —
 * repeat contact is signal, not an error.
 *
 * Capture hooks call these functions fire-and-forget: every public function
 * resolves (null / false) on failure and NEVER throws, so an attribution
 * failure can never break the user-facing action.
 *
 * SECURITY NOTE: Applicant names/emails are never included in logs or audit
 * detail payloads. Error logs emit only error_type (the Error constructor
 * name) and entity ids, never PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import type {
  IntroductionContactType,
  IntroductionEventType,
} from "@/types/truedeed";

const SIX_MONTHS = 6;
const UNIQUE_VIOLATION = "23505";

/** Maps the repeat first-contact channel onto its event-trail type. */
const CONTACT_EVENT_TYPE: Record<IntroductionContactType, IntroductionEventType> = {
  enquiry: "enquiry",
  viewing_request: "viewing_requested",
  message: "message_sent",
};

type RecordIntroductionInput = {
  applicantId: string;
  listingId: string;
  contactType: IntroductionContactType;
};

type RecordIntroductionResult = {
  introductionId: string;
  created: boolean;
};

type RecordIntroductionEventInput = {
  applicantId: string;
  listingId: string;
  eventType: IntroductionEventType;
  payload?: Record<string, unknown>;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

function addCalendarMonthsUtc(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/**
 * Records an introduction for (applicant, listing). Returns the ledger id
 * and whether a new row was created, or null on any failure. Never throws.
 */
export async function recordIntroduction(
  input: RecordIntroductionInput,
): Promise<RecordIntroductionResult | null> {
  const { applicantId, listingId, contactType } = input;

  try {
    const supabase = createAdminClient();

    // Resolve listing → agent/branch
    const { data: listing } = await supabase
      .from("listings")
      .select("id, user_id, branch_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) return null;

    // Applicant snapshot (evidence at insert time). The profiles table holds
    // the display name only; email lives on auth.users, resolved via the
    // admin auth API.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", applicantId)
      .maybeSingle();
    if (!profile) return null;

    const { data: authUser } = await supabase.auth.admin.getUserById(
      applicantId,
    );
    const applicantEmail = authUser?.user?.email;
    if (!applicantEmail) return null;

    // Pre-resolve any existing introduction so a 23505 race can be settled
    // without a post-failure re-query.
    const { data: existing } = await supabase
      .from("introductions")
      .select("id")
      .eq("applicant_id", applicantId)
      .eq("listing_id", listingId)
      .maybeSingle();

    const occurredAt = new Date();
    const { data: inserted, error: insertError } = await supabase
      .from("introductions")
      .insert({
        applicant_id: applicantId,
        listing_id: listingId,
        agent_id: listing.user_id,
        branch_id: listing.branch_id,
        first_contact_type: contactType,
        applicant_name: profile.display_name ?? "Applicant",
        applicant_email: applicantEmail,
        occurred_at: occurredAt.toISOString(),
        tail_expires_at: addCalendarMonthsUtc(occurredAt, SIX_MONTHS).toISOString(),
      })
      .select("id")
      .single();

    // Duplicate — append a repeat-contact event against the existing row.
    if (insertError) {
      const code = (insertError as { code?: string }).code;
      if (code !== UNIQUE_VIOLATION || !existing) return null;

      await supabase.from("introduction_events").insert({
        introduction_id: existing.id,
        event_type: CONTACT_EVENT_TYPE[contactType],
        payload: { repeat_contact: true },
      });
      return { introductionId: existing.id, created: false };
    }
    if (!inserted) return null;

    const introductionId = inserted.id as string;

    await supabase.from("introduction_status_history").insert({
      introduction_id: introductionId,
      status: "active",
    });

    await supabase.from("truedeed_audit_log").insert({
      action: "introduction_recorded",
      entity: "introductions",
      entity_id: introductionId,
      detail: { listing_id: listingId, contact_type: contactType },
    });

    await inngest.send({
      name: "truedeed/introduction.recorded",
      data: { introductionId },
    });

    return { introductionId, created: true };
  } catch (error: unknown) {
    console.error("[truedeed] recordIntroduction failed", {
      error_type: errorType(error),
      listing_id: listingId,
    });
    return null;
  }
}

/**
 * Appends an event-trail row to the introduction identified by
 * (applicant, listing). Returns false when no introduction exists or on
 * any failure. Never throws.
 */
export async function recordIntroductionEvent(
  input: RecordIntroductionEventInput,
): Promise<boolean> {
  const { applicantId, listingId, eventType, payload } = input;

  try {
    const supabase = createAdminClient();

    const { data: introduction } = await supabase
      .from("introductions")
      .select("id")
      .eq("applicant_id", applicantId)
      .eq("listing_id", listingId)
      .maybeSingle();
    if (!introduction) return false;

    const { error } = await supabase.from("introduction_events").insert({
      introduction_id: introduction.id,
      event_type: eventType,
      payload: payload ?? {},
    });
    return !error;
  } catch (error: unknown) {
    console.error("[truedeed] recordIntroductionEvent failed", {
      error_type: errorType(error),
      listing_id: listingId,
      event_type: eventType,
    });
    return false;
  }
}
