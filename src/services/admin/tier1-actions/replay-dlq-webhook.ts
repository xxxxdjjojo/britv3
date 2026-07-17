import { inngest } from "@/inngest/client";
import type { Tier1Action, Tier1ActionContext } from "./types";
import { Tier1ActionError } from "./types";

/**
 * Re-enqueue a stored Stripe billing event through the DLQ pipeline so the
 * shared `processStripeEvent` dispatcher runs again with the persisted payload.
 *
 * Reversible/idempotent by construction: the DLQ function claims the event
 * first, so replaying an already-processed event short-circuits without
 * re-firing side effects. Connect events (payout.* / account.updated) may no-op
 * because the stored payload lacks the connected-account id — surfaced as a
 * preview blocker.
 */

type BillingEventRow = {
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
};

function isConnectEventType(eventType: string): boolean {
  return eventType.startsWith("payout.") || eventType === "account.updated";
}

async function loadEvent(ctx: Tier1ActionContext): Promise<BillingEventRow> {
  const { data, error } = await ctx.supabase
    .from("billing_events")
    .select("stripe_event_id, event_type, payload")
    .eq("stripe_event_id", ctx.targetId)
    .maybeSingle();
  if (error) throw new Tier1ActionError("Database error", 500);
  if (!data) throw new Tier1ActionError("Billing event not found", 404);
  return data as BillingEventRow;
}

export const replayDlqWebhook: Tier1Action = {
  key: "replay-dlq-webhook",
  label: "Replay billing webhook",
  description:
    "Re-run a stored Stripe billing event through the dead-letter pipeline. Idempotent — an already-processed event is skipped.",
  requiredPermission: "manage_subscriptions",
  targetType: "billing_event",
  risk: "medium",
  reversible: true,

  async preview(ctx) {
    const row = await loadEvent(ctx);
    const blockers: string[] = [];
    if (isConnectEventType(row.event_type)) {
      blockers.push(
        "Connect event — replay may no-op (stored payload lacks the connected-account id).",
      );
    }
    return {
      summary: `Replay ${row.event_type} (${row.stripe_event_id}) through the DLQ dispatcher.`,
      effects: [
        "Emits a billing/webhook.handler_failed event so the DLQ re-runs the handler.",
        "The DLQ claims the event first, so an already-processed event is skipped.",
      ],
      reversible: true,
      requiresApproval: false,
      blockers,
    };
  },

  async execute(ctx) {
    const row = await loadEvent(ctx);
    try {
      await inngest.send({
        name: "billing/webhook.handler_failed",
        data: {
          eventId: row.stripe_event_id,
          eventType: row.event_type,
          errorMessage: "Tier-1 admin replay",
          payload: row.payload ?? {},
          // Stored payload is event.data.object only — connected-account id is
          // not recoverable, so Connect handlers short-circuit safely.
          account: null,
          attempt: 0,
        },
      });
    } catch {
      throw new Tier1ActionError("Failed to enqueue replay", 502);
    }
    return { summary: `Replay enqueued for ${row.event_type} (${row.stripe_event_id}).` };
  },
};
