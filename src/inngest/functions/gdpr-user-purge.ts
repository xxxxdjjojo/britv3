/**
 * GDPR user purge — Inngest worker.
 *
 * Listens on `gdpr/user.deletion-requested` events. Deletes user-owned data
 * from PURGE_TABLES in order, then removes the auth.users row via
 * supabase.auth.admin.deleteUser.
 *
 * Status flow (managed via kernel_deleted_users table):
 *   pending → purging → completed | failed
 *
 * KNOWN LIMITATION — PURGE_TABLES is intentionally NOT exhaustive.
 * ----------------------------------------------------------------
 * Migration 20260520000200 rewrites all ON DELETE CASCADE FKs to
 * ON DELETE RESTRICT. ~30 additional FKs reference auth.users with default
 * NO ACTION semantics (not in the migration's scope). On a user-deletion
 * attempt for an engaged user (agent with offers, landlord with notices,
 * provider with invoices, admin with audit_log entries), the loop will
 * succeed for tables in PURGE_TABLES, then the final auth.admin.deleteUser
 * call fails with FK violation.
 *
 * This is a DELIBERATE pre-launch posture (fail-loud, not silent-failure):
 *   • kernel_deleted_users.status flips to 'failed'
 *   • last_error includes the FK constraint name
 *   • Sentry captures the exception
 *   • Inngest dashboard shows the function as failed after retries
 *
 * The operator runbook is at docs/runbooks/gdpr-purge-fk-blocked.md.
 *
 * Sprint 1 follow-ups (tracked in TODOS):
 *   • Per-FK policy decisions for the ~30 unrewritten columns
 *   • Either expand PURGE_TABLES or convert FKs to ON DELETE SET NULL
 *     with appropriate column-nullability changes
 *   • Wire the service into /api/gdpr/delete and the admin GDPR fulfillment service
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { completePurge } from "@/services/gdpr/purge-service";
import {
  captureException,
  getErrorMessage,
} from "@/lib/observability/capture-exception";

const GdprUserDeletionEventSchema = z.object({
  userId: z.string().uuid(),
  requestedBy: z.string().uuid().nullable().optional(),
  reason: z
    .enum(["user_request", "admin", "gdpr_purge", "fraud"])
    .optional()
    .default("user_request"),
});

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
    // ------------------------------------------------------------------
    // Validate the event payload at runtime. A malformed event has no
    // trustworthy userId, so we cannot record a failure against
    // kernel_deleted_users -- just capture to Sentry and re-throw so
    // Inngest surfaces the bad event in the dashboard.
    // ------------------------------------------------------------------
    let data: z.infer<typeof GdprUserDeletionEventSchema>;
    try {
      data = GdprUserDeletionEventSchema.parse(event.data);
    } catch (err) {
      captureException(err, {
        module: "gdpr",
        feature: "user-purge",
        operation: "validate-event",
        extra: { rawData: event.data, attempt },
      });
      throw err instanceof Error ? err : new Error(getErrorMessage(err));
    }

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

    try {
      // ------------------------------------------------------------------
      // Delete user-owned rows table-by-table. Each table is its own step
      // so an Inngest retry resumes where it left off (Inngest caches step
      // results across retries).
      //
      // Per-step hard-fail: throwing inside the step body causes Inngest
      // to retry that specific step. If a step exhausts its own retries,
      // the function throws naturally and `fail_user_purge` is called via
      // the outer catch. This avoids the closure-accumulator pattern,
      // which is unsafe under Inngest's retry-from-cache semantics: on a
      // retry, the array would be freshly empty and the partial-fail
      // guard would silently pass.
      // ------------------------------------------------------------------
      for (const target of PURGE_TABLES) {
        await step.run(
          `delete-${target.table}-${target.column}`,
          async () => {
            const { error } = await supabase
              .from(target.table)
              .delete()
              .eq(target.column, userId);
            if (error) {
              captureException(error, {
                module: "gdpr",
                feature: "purge",
                operation: "delete-user-data",
                extra: {
                  userId,
                  table: target.table,
                  column: target.column,
                  errorCode: error.code,
                },
              });
              // Throw so Inngest retries this specific step. If we exhaust
              // retries (default 3), the function will throw and the outer
              // catch will call fail_user_purge — kernel_deleted_users.status
              // stays 'failed' and the user data is NOT silently abandoned.
              throw new Error(
                `[gdpr-purge] Failed to delete from ${target.table}.${target.column} for user ${userId}: ${error.message}`,
              );
            }
            return { table: target.table, column: target.column, ok: true };
          },
        );
      }

      // ------------------------------------------------------------------
      // Truedeed introductions ledger: append-only evidence, so rows are
      // GDPR-scrubbed (applicant PII erased, hash chain preserved) rather
      // than deleted — the SECURITY DEFINER function is the only write path
      // the immutability trigger allows. Must run BEFORE auth.users removal
      // so the applicant_id FK can be nulled.
      // ------------------------------------------------------------------
      await step.run("scrub-truedeed-introductions", async () => {
        const { error } = await supabase.rpc("gdpr_scrub_introductions", {
          p_user_id: userId,
        });
        if (error) {
          captureException(error, {
            module: "gdpr",
            feature: "purge",
            operation: "scrub-truedeed-introductions",
            extra: { userId, errorCode: error.code },
          });
          throw new Error(
            `[gdpr-purge] Failed to scrub introductions for user ${userId}: ${error.message}`,
          );
        }
        return { ok: true };
      });

      // ------------------------------------------------------------------
      // Truedeed invoice disputes (Phase 5): same evidence-grade posture as
      // introductions — the row is preserved as decision evidence, but
      // raised_by is nulled, grounds is replaced with '[erased]', and the
      // evidence file paths are wiped. The actual objects in the
      // rebuttal-evidence bucket are removed first so storage doesn't
      // outlive the row's references.
      // ------------------------------------------------------------------
      await step.run("scrub-truedeed-invoice-disputes", async () => {
        const { data: rows } = await supabase
          .from("invoice_disputes")
          .select("id, evidence_storage_paths")
          .eq("raised_by", userId);
        const paths = ((rows ?? []) as Array<{
          evidence_storage_paths: string[] | null;
        }>)
          .flatMap((r) => r.evidence_storage_paths ?? [])
          .filter((p): p is string => typeof p === "string" && p.length > 0);
        if (paths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("rebuttal-evidence")
            .remove(paths);
          if (storageError) {
            captureException(storageError, {
              module: "gdpr",
              feature: "purge",
              operation: "remove-dispute-evidence",
              extra: { userId, pathCount: paths.length },
            });
            // Storage removal failures are non-fatal: the row scrub below
            // still wipes the references. Storage cleanup can be retried
            // out-of-band via the operator runbook.
          }
        }

        const { error } = await supabase.rpc("gdpr_scrub_invoice_disputes", {
          p_user_id: userId,
        });
        if (error) {
          captureException(error, {
            module: "gdpr",
            feature: "purge",
            operation: "scrub-truedeed-invoice-disputes",
            extra: { userId, errorCode: error.code },
          });
          throw new Error(
            `[gdpr-purge] Failed to scrub invoice_disputes for user ${userId}: ${error.message}`,
          );
        }
        return { ok: true };
      });

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
      };
    } catch (err) {
      const message = getErrorMessage(err);

      captureException(err, {
        module: "gdpr",
        feature: "user-purge",
        operation: "purge-loop",
        extra: { userId, reason, attempt },
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
