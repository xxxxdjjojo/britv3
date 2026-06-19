/**
 * Inngest function: Stripe Webhook Dead-Letter Queue
 *
 * When the main webhook handler fails, it emits a `billing/webhook.handler_failed`
 * event with the original Stripe payload. This function re-runs the same
 * dispatcher (`processStripeEvent`) so a transient failure (DB hiccup,
 * downstream timeout) can be recovered automatically.
 *
 * Behaviour:
 * - Reconstructs a Stripe.Event-shaped object from the stored payload.
 * - Calls processStripeEvent — same code path the live webhook uses.
 * - On success: marks the billing_events row processed and returns.
 * - On failure: increments dlq_attempt + records last_error, then re-throws
 *   so Inngest retries (up to 3 attempts).
 * - On final exhaustion: sends the existing admin alert email.
 */

import type Stripe from "stripe";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { processStripeEvent } from "@/services/billing/stripe-event-processor";
import {
  claimBillingEvent,
  markBillingEventProcessed,
} from "@/services/billing/billing-events";
import { captureException, getErrorMessage } from "@/lib/observability/capture-exception";
import { brandConfig } from "@/config/brand";

type WebhookFailedEvent = {
  eventId: string;
  eventType: string;
  errorMessage: string;
  payload: Record<string, unknown>;
  /**
   * Connected account ID (Stripe Connect events: payout.*, account.updated).
   * Captured on the live path from `event.account` so the reconstructed
   * event used by `processStripeEvent` is not missing this field. May be
   * null for non-Connect events or for manual admin replays where the
   * stored payload does not carry the original envelope.
   */
  account: string | null;
  attempt: number;
};

/**
 * Rebuild a Stripe.Event-shaped object from the stored payload.
 *
 * The payload column stores `event.data.object` (e.g. the Subscription,
 * Checkout.Session), not the full envelope — so we wrap it back up here.
 * The `account` field is restored from the captured WebhookFailedEvent so
 * Stripe Connect handlers (payout.paid, payout.failed, account.updated) can
 * read `event.account` the way they would on the live webhook path.
 */
function reconstructStripeEvent(data: WebhookFailedEvent): Stripe.Event {
  return {
    id: data.eventId,
    type: data.eventType,
    data: { object: data.payload },
    account: data.account ?? null,
  } as unknown as Stripe.Event;
}

export const stripeWebhookDlq = inngest.createFunction(
  {
    id: "stripe-webhook-dlq",
    name: "Retry failed Stripe webhook handler",
    retries: 3,
  },
  { event: "billing/webhook.handler_failed" },
  async ({ event, step, attempt }) => {
    const data = event.data as WebhookFailedEvent;
    const supabase = createAdminClient();

    console.warn(
      `[webhook-dlq] Replaying ${data.eventType} (event: ${data.eventId}), attempt ${attempt}`,
    );

    let replayError: unknown = null;
    let replayedUserId: string | null = null;
    const stripe = getStripe();
    const reconstructed = reconstructStripeEvent(data);

    // Claim the billing_events row BEFORE replaying. If the event is already
    // marked processed (e.g. by a prior successful retry or by the live path
    // succeeding after this DLQ event was enqueued), short-circuit so we do
    // not re-fire non-idempotent side effects: force_refresh JWT update,
    // payment_failed emails, etc. The claim RPC is idempotent — for an
    // already-processed row it returns should_process=false without changing
    // status.
    const claim = await step.run("claim-replay", async () => {
      return await claimBillingEvent(supabase, reconstructed);
    });

    if (!claim.should_process) {
      console.warn(
        `[webhook-dlq] Skipping replay for ${data.eventId} — already processed`,
      );
      return {
        status: "skipped_already_processed",
        eventId: data.eventId,
        attempt,
      };
    }

    try {
      const result = await step.run("replay-stripe-event", async () => {
        const { userId } = await processStripeEvent(supabase, stripe, reconstructed);
        return { userId };
      });

      replayedUserId = result.userId;

      // Mark the billing_events row processed now that the replay succeeded.
      await step.run("mark-billing-event-processed", async () => {
        await markBillingEventProcessed(supabase, reconstructed, replayedUserId);
      });
    } catch (err) {
      replayError = err;
    }

    // Persist retry metadata in dedicated typed columns (attempt_count,
    // last_attempt_at, last_error) from the Phase A migration. Do NOT mutate
    // billing_events.payload — that column stores the original Stripe payload
    // verbatim and admins may replay from it later.
    await step.run("update-retry-status", async () => {
      const errorMessageToStore = replayError
        ? getErrorMessage(replayError)
        : null;

      await supabase
        .from("billing_events")
        .update({
          attempt_count: attempt,
          last_attempt_at: new Date().toISOString(),
          last_error: errorMessageToStore,
        })
        .eq("stripe_event_id", data.eventId);
    });

    if (!replayError) {
      console.warn(
        `[webhook-dlq] Replay succeeded for ${data.eventId} on attempt ${attempt}`,
      );
      return {
        status: "replayed",
        eventId: data.eventId,
        attempt,
      };
    }

    // Replay failed — capture and decide whether to alert.
    captureException(replayError, {
      module: "billing",
      feature: "stripe-webhook-dlq",
      operation: "replay-stripe-event",
      extra: {
        eventId: data.eventId,
        eventType: data.eventType,
        attempt,
      },
    });

    if (attempt >= 3) {
      await step.run("send-admin-alert", async () => {
        const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? `admin@${brandConfig.canonicalDomain}`;

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: `alerts@${brandConfig.canonicalDomain}`,
            to: adminEmail,
            subject: `[CRITICAL] Stripe webhook failed after 3 retries: ${data.eventType}`,
            text: [
              `Stripe Event ID: ${data.eventId}`,
              `Event Type: ${data.eventType}`,
              `Error: ${getErrorMessage(replayError)}`,
              `Attempts: ${attempt}`,
              "",
              "Action required: Check billing_events table and Stripe dashboard.",
              `Stripe Dashboard: https://dashboard.stripe.com/events/${data.eventId}`,
            ].join("\n"),
          });
        } catch (emailErr) {
          captureException(emailErr, {
            module: "billing",
            feature: "stripe-webhook-dlq",
            operation: "sendAdminAlert",
            extra: { eventId: data.eventId, eventType: data.eventType },
          });
        }
      });
    }

    // Re-throw so Inngest retries (preserving the existing 3-attempt config).
    throw replayError instanceof Error
      ? replayError
      : new Error(getErrorMessage(replayError));
  },
);
