/**
 * Inngest function: send a referee-invitation (vouch) email.
 *
 * Handles BOTH `provider/reference.requested` (initial) and
 * `provider/reference.resend-requested` (reminder). The single-step design is
 * deliberate and security-critical:
 *
 *   - The raw invitation token is generated, hashed, persisted (hash only), and
 *     emailed (raw only) INSIDE ONE `step.run`. The step returns no token, so
 *     the raw bearer secret is never written to Inngest's persisted step state.
 *   - On an Inngest retry the whole step re-runs: a NEW token is generated and
 *     `markSentReference` overwrites the stored hash, so the previous email's
 *     token becomes dead and a fresh email is sent. This is intentional — do
 *     NOT split token-gen and send into separate memoized steps (that would
 *     leak the raw token into step state). The trade-off is that a retry inflates
 *     invite_send_count by one; that minor inflation is accepted.
 *
 * Idempotency: if the row is missing, or its status is not `pending`/`sent`
 * (i.e. already submitted / verified / declined / revoked / expired), the
 * function is a no-op and sends nothing.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateReferenceToken,
  hashReferenceToken,
  computeInviteExpiry,
} from "@/lib/reference-tokens";
import { markSentReference } from "@/services/provider/reference-invitation-service";
import { getVouchRules } from "@/services/provider/vouch-rules-service";
import { getProviderDisplay } from "@/services/provider/provider-display";
import { sendReferenceInvitation } from "@/services/email/email-service";
import { appUrl } from "@/config/brand";

/** Statuses from which an invite may still be (re)sent. */
const SENDABLE_STATUSES = ["pending", "sent"] as const;

type ReferenceRow = {
  provider_id: string;
  referee_name: string;
  referee_email: string;
  reference_type: "client" | "peer";
  relationship: string | null;
  status: string;
};

type HandlerArgs = {
  event: { name: string; data: { referenceId: string } };
  step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> };
};

/**
 * Pure handler, exported for unit testing without a running Inngest. `step.run`
 * simply invokes its callback in tests.
 */
export async function handleReferenceRequestEmail({ event, step }: HandlerArgs) {
  const { referenceId } = event.data;
  const isReminder = event.name.endsWith("resend-requested");
  const supabase = createAdminClient();

  // Single atomic step — generates the token, persists only its hash, and sends
  // the email carrying only the raw token. Nothing sensitive is returned.
  return step.run("generate-token-and-send", async () => {
    const { data, error } = await supabase
      .from("provider_references")
      .select(
        "provider_id, referee_name, referee_email, reference_type, relationship, status",
      )
      .eq("id", referenceId)
      .maybeSingle();

    const row = data as ReferenceRow | null;

    // Missing row — nothing to do (idempotent no-op).
    if (error || !row) {
      return { status: "not_found", referenceId };
    }

    // Already responded to / cancelled / expired — don't email.
    if (!SENDABLE_STATUSES.includes(row.status as (typeof SENDABLE_STATUSES)[number])) {
      return { status: "skipped", referenceId, currentStatus: row.status };
    }

    const rules = await getVouchRules(supabase);
    const { providerName, providerTrade } = await getProviderDisplay(
      supabase,
      row.provider_id,
    );

    const rawToken = generateReferenceToken();
    const tokenHash = hashReferenceToken(rawToken);
    const expiresAt = computeInviteExpiry(rules.invite_expiry_days);

    const marked = await markSentReference(supabase, referenceId, {
      tokenHash,
      expiresAt,
    });
    if (!marked.success) {
      // Throw so Inngest retries (the whole step re-runs with a fresh token).
      throw new Error(`markSentReference failed: ${marked.error}`);
    }

    const submissionUrl = appUrl(`/reference/${rawToken}`);

    // sendReferenceInvitation throws on failure (it never returns success:false),
    // so the await alone propagates the error and triggers an Inngest retry.
    await sendReferenceInvitation({
      to: row.referee_email,
      refereeName: row.referee_name,
      providerName,
      providerTrade,
      referenceType: row.reference_type,
      relationship: row.relationship ?? undefined,
      submissionUrl,
      expiresAt,
      isReminder,
      providerId: row.provider_id,
    });

    return { status: "sent", referenceId, isReminder };
  });
}

export const referenceRequestEmail = inngest.createFunction(
  {
    id: "reference-request-email",
    name: "Send referee invitation email",
    // A retry re-runs the whole step: a fresh token is generated and the stored
    // hash overwritten. This is intentional and inflates invite_send_count by one
    // per retry (see file header). retries:3 makes that tolerance explicit.
    retries: 3,
  },
  [
    { event: "provider/reference.requested" },
    { event: "provider/reference.resend-requested" },
  ],
  handleReferenceRequestEmail,
);
