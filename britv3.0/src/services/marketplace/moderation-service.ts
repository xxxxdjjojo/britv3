/**
 * Moderation service -- handles admin review moderation queue operations.
 * All operations require admin-level authentication (RLS enforced).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// -- Types -------------------------------------------------------------------

type ModerationDecision = "approve" | "reject" | "flag_for_review";

type GetModerationQueueOptions = Readonly<{
  status?: string;
  limit?: number;
  offset?: number;
}>;

// -- Service functions -------------------------------------------------------

/**
 * Get the moderation queue, ordered by priority (highest first).
 * Only accessible by admins (RLS enforced at DB level).
 */
export async function getModerationQueue(
  supabase: SupabaseClient,
  options: GetModerationQueueOptions = {},
) {
  const { status, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("moderation_queue")
    .select(
      `
      *,
      reviews:review_id (
        id,
        booking_id,
        provider_id,
        reviewer_id,
        overall_rating,
        title,
        review_text,
        sentiment,
        spam_indicators,
        fake_review_probability,
        authenticity_score,
        flag_count,
        moderation_status,
        created_at
      )
    `,
      { count: "exact" },
    )
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: true });

  // Filter by queue entry status (decision field)
  if (status) {
    if (status === "pending") {
      query = query.is("decision", null);
    } else {
      query = query.eq("decision", status);
    }
  } else {
    // Default: show pending items (no decision yet)
    query = query.is("decision", null);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: entries, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get moderation queue: ${error.message}`);
  }

  return {
    entries: entries ?? [],
    total: count ?? 0,
    limit,
    offset,
  };
}

/**
 * Moderate a review: approve, reject, or flag for further review.
 * Updates both the moderation queue entry and the review's moderation_status.
 */
export async function moderateReview(
  supabase: SupabaseClient,
  moderatorId: string,
  queueEntryId: string,
  decision: ModerationDecision,
  reason?: string,
) {
  // Get the queue entry to find the review
  const { data: entry, error: entryError } = await supabase
    .from("moderation_queue")
    .select("id, review_id")
    .eq("id", queueEntryId)
    .single();

  if (entryError || !entry) {
    throw new Error("Moderation queue entry not found");
  }

  // Update the queue entry
  const { error: updateQueueError } = await supabase
    .from("moderation_queue")
    .update({
      decision,
      reason: reason ?? null,
      completed_at: new Date().toISOString(),
      assigned_to: moderatorId,
    })
    .eq("id", queueEntryId);

  if (updateQueueError) {
    throw new Error(`Failed to update queue entry: ${updateQueueError.message}`);
  }

  // Map decision to review moderation_status
  const moderationStatusMap: Record<ModerationDecision, string> = {
    approve: "approved",
    reject: "rejected",
    flag_for_review: "flagged",
  };

  const { error: updateReviewError } = await supabase
    .from("reviews")
    .update({ moderation_status: moderationStatusMap[decision] })
    .eq("id", entry.review_id);

  if (updateReviewError) {
    throw new Error(`Failed to update review status: ${updateReviewError.message}`);
  }

  // Return updated entry with review
  const { data: updated } = await supabase
    .from("moderation_queue")
    .select(
      `
      *,
      reviews:review_id (
        id,
        moderation_status,
        provider_id,
        reviewer_id
      )
    `,
    )
    .eq("id", queueEntryId)
    .single();

  return updated;
}
