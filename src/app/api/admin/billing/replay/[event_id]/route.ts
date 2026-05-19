/**
 * POST /api/admin/billing/replay/:event_id
 *
 * Re-enqueues a Stripe billing event through the DLQ pipeline so the shared
 * `processStripeEvent` dispatcher runs again with the stored payload. Useful
 * for recovering from operator-detected handler failures that the automatic
 * 3-attempt DLQ retry did not resolve.
 *
 * Security:
 * - Requires authenticated admin with `manage_subscriptions` permission.
 * - Caller must include `x-replay-signature` header containing
 *   HMAC-SHA256(REPLAY_SIGNING_SECRET, event_id) as hex. Compared with
 *   `crypto.timingSafeEqual` to avoid timing oracles.
 *
 * Behaviour:
 * 1. Verifies admin + HMAC signature.
 * 2. Looks up the billing_events row by stripe_event_id. 404 if missing.
 * 3. Emits a `billing/webhook.handler_failed` Inngest event with dlq_attempt
 *    reset to 0 so the DLQ function re-runs the dispatcher.
 * 4. Audit-logs the action via the standard admin-audit helper.
 */

import crypto from "node:crypto";
import { auditedAdminActionWithPermission, AdminActionError } from "@/lib/audited-admin-action";
import { inngest } from "@/inngest/client";

type BillingEventRow = {
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
};

function getReplaySigningSecret(): string {
  const secret = process.env.REPLAY_SIGNING_SECRET;
  if (!secret) {
    throw new AdminActionError("Replay signing secret not configured", 500);
  }
  return secret;
}

function verifyReplaySignature(eventId: string, providedSignature: string | null): boolean {
  if (!providedSignature) return false;

  const secret = getReplaySigningSecret();
  const expected = crypto.createHmac("sha256", secret).update(eventId).digest("hex");

  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (providedBuffer.length !== expectedBuffer.length) return false;

  try {
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ event_id: string }> },
) {
  const { event_id: eventId } = await params;

  // HMAC verification runs before the audited-admin wrapper so unauthenticated
  // callers without a valid signature get a clean 401 without consuming admin
  // audit log slots.
  const providedSignature = req.headers.get("x-replay-signature");
  if (!verifyReplaySignature(eventId, providedSignature)) {
    return Response.json({ error: "Invalid replay signature" }, { status: 401 });
  }

  return auditedAdminActionWithPermission(
    req,
    "billing.replay",
    "billing_event",
    eventId,
    "manage_subscriptions",
    async ({ supabase }) => {
      const { data, error } = await supabase
        .from("billing_events")
        .select("stripe_event_id, event_type, payload")
        .eq("stripe_event_id", eventId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load billing event: ${error.message}`);
      }

      const row = data as BillingEventRow | null;
      if (!row) {
        throw new AdminActionError("Billing event not found", 404);
      }

      await inngest.send({
        name: "billing/webhook.handler_failed",
        data: {
          eventId: row.stripe_event_id,
          eventType: row.event_type,
          errorMessage: "Manual admin replay",
          payload: row.payload ?? {},
          attempt: 0,
        },
      });

      return { enqueued: true, event_id: row.stripe_event_id };
    },
  );
}
