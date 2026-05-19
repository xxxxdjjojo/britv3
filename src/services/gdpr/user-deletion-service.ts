/**
 * Public entry point for the GDPR user-deletion flow.
 *
 * Callers (the user's self-delete UI, admin tools, fraud workflows) invoke
 * requestUserDeletion() instead of directly calling supabase.auth.admin
 * .deleteUser. The function:
 *
 *   1. Calls public.request_user_deletion (SECURITY DEFINER) which:
 *        - validates the user exists,
 *        - sets profiles.deleted_at = now() so the app hides them
 *          immediately, and
 *        - upserts a row into public.kernel_deleted_users marking the
 *          request as 'pending'.
 *   2. Emits "gdpr/user.deletion-requested" so the gdprUserPurge Inngest
 *      function picks it up, deletes all user-owned rows in the correct
 *      order, and finally removes the auth.users row.
 *
 * The hard deletion no longer happens in the request path -- this matters
 * because the foreign-key constraints flipped from CASCADE to RESTRICT in
 * the same migration, so direct deletes would now error.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { inngest } from "@/inngest/client";
import {
  captureException,
  getErrorMessage,
} from "@/lib/observability/capture-exception";

export type UserDeletionReason =
  | "user_request"
  | "admin"
  | "gdpr_purge"
  | "fraud";

export type UserDeletionStatus =
  | "pending"
  | "already_completed"
  | "failed";

export type RequestUserDeletionOptions = Readonly<{
  reason?: UserDeletionReason;
  adminUserId?: string | null;
}>;

export type RequestUserDeletionResult = Readonly<{
  status: UserDeletionStatus;
  error?: string;
}>;

type RpcRow = Readonly<{ status: string }>;

/**
 * Request a GDPR purge for the given user. Idempotent: re-requesting a user
 * whose row is already in kernel_deleted_users resets the status to
 * 'pending' and re-emits the Inngest event so a retry can run.
 *
 * Returns `already_completed` if the kernel_deleted_users row is already
 * marked completed (we detect this by inspecting the row after the upsert
 * -- the RPC always returns 'pending' but the underlying upsert preserves
 * status='completed' rows by not overwriting them when status was already
 * completed... see request_user_deletion RPC). For Sprint 0 the worker
 * itself short-circuits on already-completed users; this client path
 * always returns 'pending' on the happy path.
 */
export async function requestUserDeletion(
  supabase: SupabaseClient,
  userId: string,
  options: RequestUserDeletionOptions = {},
): Promise<RequestUserDeletionResult> {
  const reason: UserDeletionReason = options.reason ?? "user_request";
  const adminUserId = options.adminUserId ?? null;

  try {
    // Step 1: call the SECURITY DEFINER RPC.
    const { data, error } = await supabase
      .rpc("request_user_deletion", {
        p_user_id: userId,
        p_reason: reason,
        p_admin_user_id: adminUserId,
      })
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `request_user_deletion failed: ${error?.message ?? "no row returned"}`,
      );
    }

    const row = data as RpcRow;
    const status = row.status === "completed" ? "already_completed" : "pending";

    // Step 2: emit the Inngest event so the worker picks it up.
    // We skip the event if the user is already purged -- the worker would
    // just no-op via start_user_purge anyway, but this saves a round-trip.
    if (status === "pending") {
      await inngest.send({
        name: "gdpr/user.deletion-requested",
        data: {
          userId,
          requestedBy: adminUserId,
          reason,
        },
      });
    }

    return { status };
  } catch (err) {
    captureException(err, {
      module: "gdpr",
      feature: "user-deletion-request",
      operation: "request-user-deletion",
      extra: { userId, reason, adminUserId },
    });

    return {
      status: "failed",
      error: getErrorMessage(err),
    };
  }
}
