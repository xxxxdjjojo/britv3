/**
 * Inngest function: GDPR user purge.
 *
 * Replaces the previous CASCADE-based blast-radius deletion. The new flow:
 *
 *   1. App calls request_user_deletion RPC + emits "gdpr/user.deletion-requested".
 *   2. This function claims the purge via start_user_purge RPC.
 *   3. It deletes user-owned rows from every table in PURGE_TABLES, in order.
 *      Each table deletion runs as its own step so partial failures retry
 *      cleanly. Errors are captured to Sentry but do not abort the loop --
 *      we want to know about *every* table that still has data when the
 *      final auth.users delete is attempted.
 *   4. It deletes the auth.users row (which now has only ON DELETE RESTRICT
 *      references, so any forgotten table will surface a clear error).
 *   5. On success: complete_user_purge RPC.
 *   6. On any thrown error: fail_user_purge RPC + Inngest retries.
 *
 * The Storage cleanup (avatars, buyer-documents) is delegated to
 * completePurge() in @/services/gdpr/purge-service so the existing logic is
 * preserved.
 *
 * Event payload:
 *   {
 *     userId: string,
 *     requestedBy: string | null,
 *     reason: "user_request" | "admin" | "gdpr_purge" | "fraud",
 *   }
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { completePurge } from "@/services/gdpr/purge-service";
import {
  captureException,
  getErrorMessage,
} from "@/lib/observability/capture-exception";

export type GdprUserDeletionEvent = Readonly<{
  userId: string;
  requestedBy: string | null;
  reason: "user_request" | "admin" | "gdpr_purge" | "fraud";
}>;

type PurgeTarget = Readonly<{ table: string; column: string }>;

/**
 * Tables that hold per-user rows. Order matters: leaf/log tables first so a
 * partial purge leaves the schema in the cleanest possible state, profiles
 * last so soft-deletion is preserved as long as possible.
 *
 * If a future migration adds a new auth.users-referencing table that is NOT
 * in this list, the ON DELETE RESTRICT (from the same migration) will block
 * the final auth.users delete and the worker will fail loudly -- which is
 * the correct behaviour. Add the table here and re-run.
 */
const PURGE_TABLES: readonly PurgeTarget[] = [
  // Logs / read-state / preferences (true leaves, safe to drop first)
  { table: "consent_records", column: "user_id" },
  { table: "user_backup_codes", column: "user_id" },
  { table: "user_documents", column: "user_id" },
  { table: "user_roles", column: "user_id" },
  { table: "push_subscriptions", column: "user_id" },
  { table: "platform_events", column: "actor_id" },
  { table: "conversation_read_status", column: "user_id" },
  { table: "viewing_history", column: "user_id" },
  { table: "ai_match_results", column: "user_id" },
  { table: "ai_match_preferences", column: "user_id" },
  { table: "renter_preferences", column: "user_id" },
  { table: "saved_searches", column: "user_id" },
  { table: "saved_properties", column: "user_id" },
  { table: "moving_checklist_items", column: "user_id" },
  { table: "financial_entries", column: "user_id" },
  { table: "property_renovation_scenarios", column: "user_id" },

  // Communication (messages first, then conversation rows)
  { table: "messages", column: "sender_id" },
  { table: "conversations", column: "participant_1_id" },
  { table: "conversations", column: "participant_2_id" },

  // Reviews / moderation
  { table: "review_helpfulness", column: "user_id" },
  { table: "review_flags", column: "user_id" },
  { table: "reviews", column: "reviewer_id" },
  { table: "content_reports", column: "reporter_id" },

  // Referrals
  { table: "referral_rewards", column: "recipient_id" },
  { table: "referral_conversions", column: "referrer_id" },
  { table: "referral_conversions", column: "referred_id" },
  { table: "referrals", column: "referrer_id" },
  { table: "referral_codes_v2", column: "user_id" },
  { table: "referral_codes", column: "user_id" },

  // Billing
  { table: "refund_requests", column: "user_id" },
  { table: "subscriptions", column: "user_id" },

  // Buyer-side activity
  { table: "viewings", column: "user_id" },
  { table: "offers", column: "user_id" },
  { table: "bookings", column: "user_id" },

  // Listings
  { table: "listings", column: "user_id" },
  { table: "listing_description_attempts", column: "seller_id" },

  // Property / documents / verification
  { table: "property_documents", column: "uploaded_by" },
  { table: "provider_documents", column: "user_id" },
  { table: "provider_verifications", column: "user_id" },
  { table: "service_provider_details", column: "user_id" },
  { table: "service_requests", column: "user_id" },

  // Landlord / tenancies
  { table: "tenant_applications", column: "landlord_id" },
  { table: "tenancies", column: "landlord_id" },
  { table: "landlord_profiles", column: "user_id" },

  // Seller dashboard
  { table: "seller_viewings", column: "seller_id" },
  { table: "seller_offers", column: "seller_id" },
  { table: "seller_listings", column: "seller_id" },
  { table: "sale_progression_stages", column: "seller_id" },

  // Agent dashboard (high-volume — most cascades live here)
  { table: "agent_viewing_slots", column: "agent_id" },
  { table: "viewing_slots", column: "agent_id" },
  { table: "agent_viewing_feedback", column: "agent_id" },
  { table: "agent_vendor_reports", column: "agent_id" },
  { table: "agent_team_members", column: "user_id" },
  { table: "agent_team_members", column: "agent_id" },
  { table: "agent_sale_progressions", column: "agent_id" },
  { table: "agent_offer_history", column: "actor_id" },
  { table: "agent_offers", column: "agent_id" },
  { table: "agent_lead_activities", column: "actor_id" },
  { table: "agent_leads", column: "agent_id" },
  { table: "agent_feed_integrations", column: "agent_id" },
  { table: "agent_enquiries", column: "seller_id" },
  { table: "agent_enquiries", column: "agent_id" },
  { table: "agent_crm_clients", column: "agent_id" },
  { table: "agent_commissions", column: "agent_id" },
  { table: "agent_branches", column: "agent_id" },
  { table: "agent_api_keys", column: "agent_id" },
  { table: "agent_agency_profiles", column: "user_id" },
  { table: "agent_agency_profiles", column: "agent_id" },
  { table: "agent_profiles", column: "id" },

  // Profile is last -- soft-deleted by request_user_deletion; hard-deleted
  // here once every reference is gone.
  { table: "profiles", column: "id" },
];

type StartPurgeRow = Readonly<{
  status: "pending" | "purging" | "completed" | "failed";
  attempt_count: number;
}>;

async function callStartUserPurge(
  supabase: SupabaseClient,
  userId: string,
): Promise<StartPurgeRow> {
  const { data, error } = await supabase
    .rpc("start_user_purge", { p_user_id: userId })
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `start_user_purge failed: ${error?.message ?? "no row returned"}`,
    );
  }

  return data as StartPurgeRow;
}

async function callCompleteUserPurge(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.rpc("complete_user_purge", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`complete_user_purge failed: ${error.message}`);
  }
}

async function callFailUserPurge(
  supabase: SupabaseClient,
  userId: string,
  errorMessage: string,
): Promise<void> {
  await supabase.rpc("fail_user_purge", {
    p_user_id: userId,
    p_error: errorMessage,
  });
}

export const gdprUserPurge = inngest.createFunction(
  {
    id: "gdpr-user-purge",
    name: "GDPR user purge",
    retries: 3,
  },
  { event: "gdpr/user.deletion-requested" },
  async ({ event, step, attempt }) => {
    const data = event.data as GdprUserDeletionEvent;
    const { userId, reason } = data;
    const supabase = createAdminClient();

    // ------------------------------------------------------------------
    // Claim the purge (or short-circuit if already completed).
    // ------------------------------------------------------------------
    const claim = await step.run("claim-purge", async () =>
      callStartUserPurge(supabase, userId),
    );

    if (claim.status === "completed") {
      return {
        status: "already_completed" as const,
        userId,
        attempt,
      };
    }

    const tableErrors: Array<{ table: string; column: string; error: string }> =
      [];

    try {
      // ------------------------------------------------------------------
      // Delete user-owned rows table-by-table. Each table is its own step
      // so an Inngest retry resumes where it left off (Inngest caches step
      // results across retries).
      // ------------------------------------------------------------------
      for (const target of PURGE_TABLES) {
        const stepId = `delete-${target.table}-${target.column}`;
        await step.run(stepId, async () => {
          const { error } = await supabase
            .from(target.table)
            .delete()
            .eq(target.column, userId);

          if (error) {
            tableErrors.push({
              table: target.table,
              column: target.column,
              error: error.message,
            });
            captureException(error, {
              module: "gdpr",
              feature: "user-purge",
              operation: "delete-table",
              extra: {
                userId,
                reason,
                table: target.table,
                column: target.column,
                attempt,
              },
            });
          }

          return { table: target.table, ok: !error };
        });
      }

      // ------------------------------------------------------------------
      // Storage + auth.users cleanup. completePurge() removes avatars,
      // buyer-documents, and the auth.users row. If a public.* table still
      // references the user, ON DELETE RESTRICT will surface a clear error
      // here -- which is intentional (it tells the operator exactly which
      // table needs to be added to PURGE_TABLES).
      // ------------------------------------------------------------------
      await step.run("delete-auth-and-storage", async () => {
        await completePurge(userId);
      });

      await step.run("mark-completed", async () =>
        callCompleteUserPurge(supabase, userId),
      );

      return {
        status: "completed" as const,
        userId,
        attempt,
        tableErrors,
      };
    } catch (err) {
      const message = getErrorMessage(err);

      captureException(err, {
        module: "gdpr",
        feature: "user-purge",
        operation: "purge-loop",
        extra: { userId, reason, attempt, tableErrors },
      });

      // Best-effort: record the failure so admins can see the latest error.
      await step.run("mark-failed", async () => {
        await callFailUserPurge(supabase, userId, message);
      });

      // Re-throw so Inngest retries (config: retries: 3).
      throw err instanceof Error ? err : new Error(message);
    }
  },
);
