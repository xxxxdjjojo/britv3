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
 * Returns `already_completed` when the kernel_deleted_users row is already
 * marked completed. The RPC reports this directly via `status='already_completed'`
 * (see migration 20260520000300_gdpr_deletion_fixes.sql); we short-circuit
 * here and skip the Inngest emit because the worker would no-op anyway.
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

    // Short-circuit on already-completed users: no Inngest event needed.
    if (row.status === "already_completed") {
      return { status: "already_completed" };
    }

    // Step 2: emit the Inngest event so the worker picks up the pending purge.
    await inngest.send({
      name: "gdpr/user.deletion-requested",
      data: {
        userId,
        requestedBy: adminUserId,
        reason,
      },
    });

    return { status: "pending" };
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
