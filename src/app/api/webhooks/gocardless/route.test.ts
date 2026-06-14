/**
 * Tests for the GoCardless webhook route (TDD RED — route not yet implemented)
 *
 * Pins the contract of POST @/app/api/webhooks/gocardless/route per
 * docs/truedeed/billing-flow-gocardless.md §1 / §5.
 *
 * CONTRACT DECISIONS pinned here (GREEN authors must follow):
 *  - Signature: verifyGoCardlessWebhook(rawBody, Webhook-Signature header,
 *    process.env.GOCARDLESS_WEBHOOK_SECRET) from @/lib/truedeed/gocardless-client.
 *    Missing secret → 500 with NO verification and NO processing.
 *    Invalid signature → 498 (GoCardless' documented invalid-signature status).
 *  - Payload: { events: [...] }. Dispatch per event:
 *      payments confirmed    → invoice-service.recordPaymentConfirmed(links.payment)
 *      payments failed       → invoice-service.recordPaymentFailed(links.payment)
 *      payments charged_back → invoice-service.recordChargeback(links.payment)
 *                              (freeze auto-collection ONLY — no suspension,
 *                               clause 8.6; see invoice-service.test.ts)
 *      mandates cancelled / expired / failed
 *                            → mandate-service.applyMandateEvent({ mandateId:
 *                              links.mandate, action }) (updates
 *                              agent_agency_profiles.mandate_status) + inngest
 *                              'truedeed/mandate.broken' { mandateId } — starts
 *                              the clause 8.3 10-business-day clock.
 *      unknown resource_type → acknowledged 200, no processing.
 *  - Idempotency: dedupe keyed on the GoCardless EVENT id via a
 *    truedeed_audit_log existence check (same pattern as the resend route);
 *    a redelivered event id → 200 with no double-processing, and the audit
 *    row payload must therefore contain the event id.
 *
 * All test data is synthetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/truedeed/gocardless-client", () => ({
  verifyGoCardlessWebhook: vi.fn(),
}));

vi.mock("@/services/truedeed/invoice-service", () => ({
  recordPaymentConfirmed: vi.fn(),
  recordPaymentFailed: vi.fn(),
  recordChargeback: vi.fn(),
}));

vi.mock("@/services/truedeed/mandate-service", () => ({
  applyMandateEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

import { verifyGoCardlessWebhook } from "@/lib/truedeed/gocardless-client";
import {
  recordPaymentConfirmed,
  recordPaymentFailed,
  recordChargeback,
} from "@/services/truedeed/invoice-service";
import { applyMandateEvent } from "@/services/truedeed/mandate-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { POST } from "@/app/api/webhooks/gocardless/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "synthetic-gc-webhook-secret"; // test-only value
const SIGNATURE = "a".repeat(64); // synthetic hex signature
const GC_PAYMENT_ID = "PM_synthetic_123";
const GC_MANDATE_ID = "MD_synthetic_123";

function paymentEvent(action: string, id = `EV_pay_${action}`) {
  return {
    id,
    resource_type: "payments",
    action,
    links: { payment: GC_PAYMENT_ID },
  };
}

function mandateEvent(action: string, id = `EV_man_${action}`) {
  return {
    id,
    resource_type: "mandates",
    action,
    links: { mandate: GC_MANDATE_ID },
  };
}

function makeRequest(events: unknown[], signature: string = SIGNATURE): Request {
  return new Request("http://localhost/api/webhooks/gocardless", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-signature": signature,
    },
    body: JSON.stringify({ events }),
  });
}

// ---------------------------------------------------------------------------
// DB mock — audit-log dedupe (pattern from webhooks/resend/route.test.ts)
// ---------------------------------------------------------------------------

function createDb() {
  const auditInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const auditMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: null, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditFilter: any = {};
  auditFilter.eq = vi.fn(() => auditFilter);
  auditFilter.contains = vi.fn(() => auditFilter);
  auditFilter.maybeSingle = auditMaybeSingle;
  const auditSelect = vi.fn(() => auditFilter);

  const from = vi.fn((table: string) => {
    if (table === "truedeed_audit_log") {
      return { insert: auditInsert, select: auditSelect };
    }
    return {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return { supabase: { from }, from, auditInsert, auditMaybeSingle };
}

let db: ReturnType<typeof createDb>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GOCARDLESS_WEBHOOK_SECRET", WEBHOOK_SECRET);
  db = createDb();
  vi.mocked(createAdminClient).mockReturnValue(db.supabase as never);
  vi.mocked(verifyGoCardlessWebhook).mockReturnValue(true);
  vi.mocked(recordPaymentConfirmed).mockResolvedValue(true as never);
  vi.mocked(recordPaymentFailed).mockResolvedValue(true as never);
  vi.mocked(recordChargeback).mockResolvedValue(true as never);
  vi.mocked(applyMandateEvent).mockResolvedValue(true as never);
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 1. Configuration & signature verification
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/gocardless — secret & signature", () => {
  it("returns 500 with NO verification and NO processing when GOCARDLESS_WEBHOOK_SECRET is missing", async () => {
    // Arrange
    vi.stubEnv("GOCARDLESS_WEBHOOK_SECRET", "");

    // Act
    const response = await POST(makeRequest([paymentEvent("confirmed")]));

    // Assert
    expect(response.status).toBe(500);
    expect(verifyGoCardlessWebhook).not.toHaveBeenCalled();
    expect(recordPaymentConfirmed).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("verifies the RAW body against the Webhook-Signature header and the secret", async () => {
    // Act
    await POST(makeRequest([paymentEvent("confirmed")]));

    // Assert
    expect(verifyGoCardlessWebhook).toHaveBeenCalledWith(
      expect.stringContaining("EV_pay_confirmed"),
      SIGNATURE,
      WEBHOOK_SECRET,
    );
  });

  it("returns 498 (GoCardless invalid-signature convention) with NO processing when the signature is bad", async () => {
    // Arrange
    vi.mocked(verifyGoCardlessWebhook).mockReturnValue(false);

    // Act
    const response = await POST(makeRequest([paymentEvent("confirmed")]));

    // Assert
    expect(response.status).toBe(498);
    expect(recordPaymentConfirmed).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. Payment events
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/gocardless — payment events", () => {
  it("payments/confirmed → recordPaymentConfirmed(payment id) → 200", async () => {
    // Act
    const response = await POST(makeRequest([paymentEvent("confirmed")]));

    // Assert
    expect(response.status).toBe(200);
    expect(recordPaymentConfirmed).toHaveBeenCalledWith(GC_PAYMENT_ID);
    expect(recordPaymentFailed).not.toHaveBeenCalled();
    expect(recordChargeback).not.toHaveBeenCalled();
  });

  it("payments/failed → recordPaymentFailed(payment id) → 200", async () => {
    // Act
    const response = await POST(makeRequest([paymentEvent("failed")]));

    // Assert
    expect(response.status).toBe(200);
    expect(recordPaymentFailed).toHaveBeenCalledWith(GC_PAYMENT_ID);
    expect(recordPaymentConfirmed).not.toHaveBeenCalled();
  });

  it("payments/charged_back → recordChargeback(payment id) only — no confirm/fail handling, no suspension event", async () => {
    // Act
    const response = await POST(makeRequest([paymentEvent("charged_back")]));

    // Assert
    expect(response.status).toBe(200);
    expect(recordChargeback).toHaveBeenCalledWith(GC_PAYMENT_ID);
    expect(recordPaymentConfirmed).not.toHaveBeenCalled();
    expect(recordPaymentFailed).not.toHaveBeenCalled();
    // Chargeback freezes auto-collection only (clause 8.6) — the route never
    // triggers a billing suspension itself.
    expect(inngest.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "truedeed/billing.suspension-changed" }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Mandate events (clause 8.3 clock)
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/gocardless — mandate events", () => {
  it("mandates cancelled / expired / failed → applyMandateEvent({ mandateId, action }) + inngest 'truedeed/mandate.broken' { mandateId } per event", async () => {
    // Act
    const response = await POST(
      makeRequest([
        mandateEvent("cancelled"),
        mandateEvent("expired"),
        mandateEvent("failed"),
      ]),
    );

    // Assert
    expect(response.status).toBe(200);
    for (const action of ["cancelled", "expired", "failed"]) {
      expect(applyMandateEvent).toHaveBeenCalledWith({
        mandateId: GC_MANDATE_ID,
        action,
      });
    }
    expect(
      vi
        .mocked(inngest.send)
        .mock.calls.filter(
          (c) =>
            (c[0] as { name?: string }).name === "truedeed/mandate.broken",
        ),
    ).toHaveLength(3);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/mandate.broken",
        data: expect.objectContaining({ mandateId: GC_MANDATE_ID }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Idempotency & unknown resource types
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/gocardless — idempotency & acks", () => {
  it("writes an audit row containing the GoCardless event id (the idempotency key)", async () => {
    // Act
    await POST(makeRequest([paymentEvent("confirmed", "EV_keyed_42")]));

    // Assert
    expect(db.auditInsert).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(db.auditInsert.mock.calls[0][0])).toContain(
      "EV_keyed_42",
    );
  });

  it("a redelivered event id returns 200 with NO double-processing and no second audit row", async () => {
    // Arrange — first delivery: no existing audit row
    db.auditMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const first = await POST(
      makeRequest([paymentEvent("confirmed", "EV_dup_001")]),
    );
    expect(first.status).toBe(200);
    expect(recordPaymentConfirmed).toHaveBeenCalledTimes(1);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);

    // Redelivery: the audit row now exists for this event id
    db.auditMaybeSingle.mockResolvedValue({
      data: { id: "audit-existing-1" },
      error: null,
    });

    // Act
    const second = await POST(
      makeRequest([paymentEvent("confirmed", "EV_dup_001")]),
    );

    // Assert
    expect(second.status).toBe(200);
    expect(recordPaymentConfirmed).toHaveBeenCalledTimes(1);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);
  });

  it("an unknown resource_type is acknowledged with 200 and no processing", async () => {
    // Act
    const response = await POST(
      makeRequest([
        {
          id: "EV_refund_1",
          resource_type: "refunds",
          action: "created",
          links: { refund: "RF_synthetic_1" },
        },
      ]),
    );

    // Assert
    expect(response.status).toBe(200);
    expect(recordPaymentConfirmed).not.toHaveBeenCalled();
    expect(recordPaymentFailed).not.toHaveBeenCalled();
    expect(recordChargeback).not.toHaveBeenCalled();
    expect(applyMandateEvent).not.toHaveBeenCalled();
  });
});
