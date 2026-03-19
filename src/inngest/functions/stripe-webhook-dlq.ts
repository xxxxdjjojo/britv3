/**
 * Inngest function: Stripe Webhook Dead-Letter Queue
 *
 * When the main webhook handler fails, it emits a "billing/webhook.handler_failed"
 * event. This function retries and alerts admin on final failure.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

type WebhookFailedEvent = {
  eventId: string;
  eventType: string;
  errorMessage: string;
  payload: Record<string, unknown>;
  attempt: number;
};

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

    console.log(
      `[webhook-dlq] Retrying ${data.eventType} (event: ${data.eventId}), attempt ${attempt}`,
    );

    await step.run("update-retry-status", async () => {
      await supabase
        .from("billing_events")
        .update({
          payload: {
            ...(data.payload as Record<string, unknown>),
            dlq_attempt: attempt,
            dlq_last_error: data.errorMessage,
          },
        })
        .eq("stripe_event_id", data.eventId);
    });

    if (attempt >= 3) {
      await step.run("send-admin-alert", async () => {
        const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? "admin@britestate.co.uk";

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: "alerts@britestate.co.uk",
            to: adminEmail,
            subject: `[CRITICAL] Stripe webhook failed after 3 retries: ${data.eventType}`,
            text: [
              `Stripe Event ID: ${data.eventId}`,
              `Event Type: ${data.eventType}`,
              `Error: ${data.errorMessage}`,
              `Attempts: ${attempt}`,
              "",
              "Action required: Check billing_events table and Stripe dashboard.",
              `Stripe Dashboard: https://dashboard.stripe.com/events/${data.eventId}`,
            ].join("\n"),
          });
        } catch (emailErr) {
          console.error("[webhook-dlq] Failed to send admin alert:", emailErr);
        }
      });
    }

    return {
      status: attempt >= 3 ? "exhausted" : "retried",
      eventId: data.eventId,
      attempt,
    };
  },
);
