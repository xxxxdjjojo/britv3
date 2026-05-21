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
 * - Caller must include two headers:
 *   - `x-replay-timestamp`: UNIX seconds (string). Rejected if older than
 *     5 minutes to prevent replay of captured signatures.
 *   - `x-replay-signature`: hex HMAC-SHA256 of `${timestamp}.${event_id}`
 *     using REPLAY_SIGNING_SECRET. Compared with `crypto.timingSafeEqual`.
 *
 * Behaviour:
 * 1. Verifies the signing secret is configured (503 if not).
 * 2. Verifies timestamp freshness + HMAC signature (401 on failure).
 * 3. Verifies admin auth + permission via auditedAdminActionWithPermission.
 * 4. Looks up the billing_events row by stripe_event_id. 404 if missing.
 * 5. Emits a `billing/webhook.handler_failed` Inngest event so the DLQ
 *    function re-runs the dispatcher. The DLQ now claims the event first
 *    (idempotency), so manual replay of an already-processed event will
 *    short-circuit cleanly without re-firing side effects.
 * 6. Audit-logs the action via the standard admin-audit helper.
 *
 * Limitations:
 * - Stripe Connect events (payout.paid, payout.failed, account.updated)
 *   require `event.account` (connected account ID). The live webhook path
 *   captures this from the original Stripe envelope, but `billing_events.payload`
 *   stores `event.data.object` only — the connected account ID is not
 *   recoverable from the stored payload. For Connect events the response
 *   includes a `warning` field; the DLQ will reconstruct with `account: null`
 *   and the processor will short-circuit. Connect replay support is a follow-up.
 */

import crypto from "node:crypto";
import {
  auditedAdminActionWithPermission,
  AdminActionError,
} from "@/lib/audited-admin-action";
import { inngest } from "@/inngest/client";
import { captureException } from "@/lib/observability/capture-exception";

type BillingEventRow = {
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
};

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

function isConnectEventType(eventType: string): boolean {
  return eventType.startsWith("payout.") || eventType === "account.updated";
}

function verifyReplaySignature(
  secret: string,
  eventId: string,
  timestamp: string | null,
  providedSignature: string | null,
): boolean {
  if (!timestamp || !providedSignature) return false;

  // Timestamp must be a positive integer (UNIX seconds).
  if (!/^\d+$/.test(timestamp)) return false;
  const tsNumber = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNumber)) return false;

  // Reject stale signatures to prevent replay of captured credentials.
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNumber) > TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${eventId}`)
    .digest("hex");

  let providedBuffer: Buffer;
  let expectedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(providedSignature, "hex");
    expectedBuffer = Buffer.from(expected, "hex");
  } catch {
    return false;
  }

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
  // Configuration check must produce a typed 503 rather than letting an
  // uncaught throw fall through to Next.js's generic 500 (which would lack
  // a Sentry trace and an actionable message for the operator).
  const replaySecret = process.env.REPLAY_SIGNING_SECRET;
  if (!replaySecret) {
    captureException(new Error("REPLAY_SIGNING_SECRET not configured"), {
      module: "billing",
      feature: "admin-replay",
      operation: "secret-check",
    });
    return Response.json(
      { error: "Replay endpoint not configured" },
      { status: 503 },
    );
  }

  const { event_id: eventId } = await params;

  // HMAC verification runs before the audited-admin wrapper so unauthenticated
  // callers without a valid signature get a clean 401 without consuming admin
  // audit log slots.
  const providedSignature = req.headers.get("x-replay-signature");
  const providedTimestamp = req.headers.get("x-replay-timestamp");
  if (
    !verifyReplaySignature(
      replaySecret,
      eventId,
      providedTimestamp,
      providedSignature,
    )
  ) {
    return Response.json({ error: "Invalid replay signature" }, { status: 401 });
  }

  return auditedAdminActionWithPermission(
    req,
    "billing.replay",
    "billing_event",
    eventId,
    "manage_subscriptions",
    async ({ supabase }) => {
      let row: BillingEventRow | null;
      try {
        const { data, error } = await supabase
          .from("billing_events")
          .select("stripe_event_id, event_type, payload")
          .eq("stripe_event_id", eventId)
          .maybeSingle();

        if (error) {
          captureException(error, {
            module: "billing",
            feature: "admin-replay",
            operation: "billing_events.select",
            extra: { eventId },
          });
          throw new AdminActionError("Database error", 500);
        }

        row = data as BillingEventRow | null;
      } catch (err) {
        if (err instanceof AdminActionError) throw err;
        captureException(err, {
          module: "billing",
          feature: "admin-replay",
          operation: "billing_events.select",
          extra: { eventId },
        });
        throw new AdminActionError("Database error", 500);
      }

      if (!row) {
        throw new AdminActionError("Billing event not found", 404);
      }

      try {
        await inngest.send({
          name: "billing/webhook.handler_failed",
          data: {
            eventId: row.stripe_event_id,
            eventType: row.event_type,
            errorMessage: "Manual admin replay",
            payload: row.payload ?? {},
            // The stored payload is `event.data.object` only — the original
            // `event.account` (connected account ID) is not recoverable here.
            // For Connect events this means the processor will short-circuit
            // safely on `if (!accountId) return early`; the caller is warned
            // below.
            account: null,
            attempt: 0,
          },
        });
      } catch (err) {
        captureException(err, {
          module: "billing",
          feature: "admin-replay",
          operation: "inngest.send",
          extra: { eventId },
        });
        throw new AdminActionError("Failed to enqueue replay", 502);
      }

      const response: {
        enqueued: true;
        event_id: string;
        warning?: string;
      } = {
        enqueued: true,
        event_id: row.stripe_event_id,
      };

      if (isConnectEventType(row.event_type)) {
        response.warning =
          "Connect events may no-op on manual replay because the stored payload does not carry the connected-account ID.";
      }

      return response;
    },
  );
}
